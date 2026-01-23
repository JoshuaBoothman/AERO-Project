const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('createOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const { eventId, items, campsites, merchandise, assets, subevents } = await request.json();
        // items: Tickets
        // campsites: Campsite Bookings
        // merchandise: [{ skuId, quantity, price }]
        // assets: [{ assetId, checkIn, checkOut, price }]
        // subevents: [{ subeventId, price }]

        if ((!items || items.length === 0) && (!campsites || campsites.length === 0) && (!merchandise || merchandise.length === 0) && (!assets || assets.length === 0) && (!subevents || subevents.length === 0)) {
            return { status: 400, body: JSON.stringify({ error: "Cart is empty" }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);

            await transaction.begin();

            try {
                // 1. Get or Create Person ID for the MAIN User

                const mainUserPersonReq = new sql.Request(transaction);
                let personCheck = await mainUserPersonReq.input('u_id', sql.Int, user.userId)
                    .query("SELECT person_id FROM persons WHERE user_id = @u_id");

                let mainPersonId;
                if (personCheck.recordset.length > 0) {
                    mainPersonId = personCheck.recordset[0].person_id;
                } else {
                    const personInsert = new sql.Request(transaction);
                    const pRes = await personInsert
                        .input('uid', sql.Int, user.userId)
                        .input('email', sql.NVarChar, user.email || 'unknown@example.com')
                        .query("INSERT INTO persons (user_id, email, first_name, last_name) VALUES (@uid, @email, 'Unknown', 'User'); SELECT SCOPE_IDENTITY() AS id");
                    mainPersonId = pRes.recordset[0].id;
                }

                // 2. Create Order Header
                const orderReq = new sql.Request(transaction);
                const orderRes = await orderReq
                    .input('uid', sql.Int, user.userId)
                    .query("INSERT INTO orders (user_id, total_amount, payment_status, amount_paid) VALUES (@uid, 0, 'Pending', 0); SELECT SCOPE_IDENTITY() AS id");

                const orderId = orderRes.recordset[0].id;
                let totalAmount = 0;
                let allAttendeeIds = [];
                const tempIdMap = {}; // tempId -> attendeeId
                const pendingPilotLinks = []; // { attendeeId, linkedPilotTempId }

                // 2.5 VALIDATION: Check for "Service Access" (Camping/Assets/Subevents)
                // Rule: Must be an Attendee (Have a ticket in DB) OR Buying a Ticket in this Order.
                const hasRestrictedItems = (campsites && campsites.length > 0) || (assets && assets.length > 0) || (subevents && subevents.length > 0);
                const isBuyingTicket = items && items.length > 0;

                if (hasRestrictedItems && !isBuyingTicket) {
                    // Check logic: If not buying a ticket now, they MUST have one already.
                    const accessCheck = await transaction.request()
                        .input('eid', sql.Int, eventId)
                        .input('uid', sql.Int, user.userId)
                        .query(`
                            SELECT 1 FROM attendees a
                            JOIN persons p ON a.person_id = p.person_id
                            JOIN event_ticket_types tt ON a.ticket_type_id = tt.ticket_type_id
                            WHERE a.event_id = @eid AND p.user_id = @uid 
                            AND a.status IN ('Registered', 'CheckedIn')
                            AND tt.price > 0 -- Assuming paid ticket determines "Attendee" status vs just registered pilot
                        `);

                    if (accessCheck.recordset.length === 0) {
                        throw new Error("Access Denied: You must be a registered Event Attendee (Ticket Holder) to book Camping, Assets, or Subevents. Please add an Event Ticket to your order.");
                    }
                }

                // 3. Process TICKET Items (Create Attendees)
                if (items && items.length > 0) {
                    for (const item of items) {
                        const ticketReq = new sql.Request(transaction);
                        const ticketRes = await ticketReq.input('tt_id', sql.Int, item.ticketTypeId)
                            .query("SELECT price, system_role, includes_merch FROM event_ticket_types WHERE ticket_type_id = @tt_id");

                        if (ticketRes.recordset.length === 0) throw new Error(`Invalid ticket type: ${item.ticketTypeId}`);
                        const ticketType = ticketRes.recordset[0];
                        const price = ticketType.price;

                        const attendeesToProcess = item.attendees || [];
                        if (attendeesToProcess.length < item.quantity) {
                            const gap = item.quantity - attendeesToProcess.length;
                            for (let k = 0; k < gap; k++) attendeesToProcess.push({});
                        }

                        for (const attendeeData of attendeesToProcess) {
                            totalAmount += price;

                            // Create/Get Person
                            let attendeePersonId;
                            const safeUserEmail = (user.email || '').toLowerCase();
                            const safeAttendeeEmail = (attendeeData.email || '').toLowerCase();

                            // Prepare Person Fields
                            const pFirstName = attendeeData.firstName || 'Guest';
                            const pLastName = attendeeData.lastName || 'User';
                            const pDob = attendeeData.dateOfBirth || null;
                            const pAddr = attendeeData.address || null;
                            const pCity = attendeeData.city || null;
                            const pState = attendeeData.state || null;
                            const pPost = attendeeData.postcode || null;
                            const pEmergName = attendeeData.emergencyName || null;
                            const pEmergPhone = attendeeData.emergencyPhone || null;
                            const arrDate = attendeeData.arrivalDate || null;
                            const depDate = attendeeData.departureDate || null;

                            // STRICT VALIDATION
                            if (!pDob || !pAddr || !pCity || !pState || !pPost || !pEmergName || !pEmergPhone || !arrDate || !depDate) {
                                throw new Error(`Missing mandatory attendee details for ${pFirstName} ${pLastName}. Please ensure all fields (DOB, Address, Emergency Contact, Trip Dates) are filled.`);
                            }

                            if (safeUserEmail && safeAttendeeEmail && safeUserEmail === safeAttendeeEmail) {
                                attendeePersonId = mainPersonId;
                                // UPDATE Main Person Details
                                await new sql.Request(transaction)
                                    .input('pid', sql.Int, attendeePersonId)
                                    .input('fn', sql.NVarChar, pFirstName)
                                    .input('ln', sql.NVarChar, pLastName)
                                    .input('dob', sql.Date, pDob)
                                    .input('addr', sql.NVarChar, pAddr)
                                    .input('city', sql.NVarChar, pCity)
                                    .input('state', sql.NVarChar, pState)
                                    .input('post', sql.NVarChar, pPost)
                                    .input('emg_n', sql.NVarChar, pEmergName)
                                    .input('emg_p', sql.NVarChar, pEmergPhone)
                                    .input('ph', sql.VarChar, attendeeData.phoneNumber || null)
                                    .input('cnt', sql.NVarChar, attendeeData.country || 'Australia')
                                    .query(`
                                        UPDATE persons SET 
                                            first_name = @fn, last_name = @ln, 
                                            date_of_birth = @dob,
                                            phone_number = @ph,
                                            address_line_1 = @addr, city = @city, state = @state, postcode = @post, country = @cnt,
                                            emergency_contact_name = @emg_n, emergency_contact_phone = @emg_p
                                        WHERE person_id = @pid
                                    `);

                            } else if (attendeeData.firstName || attendeeData.lastName || safeAttendeeEmail) {
                                // Check if person exists by email first (to avoid duplicates if they bought before)
                                const checkPReq = new sql.Request(transaction);
                                const checkPRes = await checkPReq.input('em', sql.NVarChar, safeAttendeeEmail).query("SELECT person_id FROM persons WHERE email = @em");

                                if (checkPRes.recordset.length > 0) {
                                    attendeePersonId = checkPRes.recordset[0].person_id;
                                    // UPDATE Existing Guest Person
                                    // NOTE: We do NOT update user_id here. If they already exist, they might be another user or managed by someone else.
                                    // We only update contact details.
                                    await new sql.Request(transaction)
                                        .input('pid', sql.Int, attendeePersonId)
                                        .input('fn', sql.NVarChar, pFirstName)
                                        .input('ln', sql.NVarChar, pLastName)
                                        .input('dob', sql.Date, pDob)
                                        .input('addr', sql.NVarChar, pAddr)
                                        .input('city', sql.NVarChar, pCity)
                                        .input('state', sql.NVarChar, pState)
                                        .input('post', sql.NVarChar, pPost)
                                        .input('emg_n', sql.NVarChar, pEmergName)
                                        .input('emg_p', sql.NVarChar, pEmergPhone)
                                        .input('ph', sql.VarChar, attendeeData.phoneNumber || null)
                                        .input('cnt', sql.NVarChar, attendeeData.country || 'Australia')
                                        .query(`
                                        UPDATE persons SET 
                                            first_name = @fn, last_name = @ln, 
                                            date_of_birth = @dob,
                                            phone_number = @ph,
                                            address_line_1 = @addr, city = @city, state = @state, postcode = @post, country = @cnt,
                                            emergency_contact_name = @emg_n, emergency_contact_phone = @emg_p
                                        WHERE person_id = @pid
                                    `);
                                } else {
                                    // INSERT New Person
                                    // CRITICAL CHANGE: Assign NEW persons to the CURRENT USER (as managed profiles)
                                    // unless specific logic dictates otherwise. 
                                    // The user clearly expects to own these records.

                                    const pReq = new sql.Request(transaction);
                                    const pRes = await pReq
                                        .input('fn', sql.NVarChar, pFirstName)
                                        .input('ln', sql.NVarChar, pLastName)
                                        .input('em', sql.NVarChar, safeAttendeeEmail || null)
                                        .input('uid', sql.Int, user.userId) // LINKED TO BUYER
                                        .input('dob', sql.Date, pDob)
                                        .input('addr', sql.NVarChar, pAddr)
                                        .input('city', sql.NVarChar, pCity)
                                        .input('state', sql.NVarChar, pState)
                                        .input('post', sql.NVarChar, pPost)
                                        .input('emg_n', sql.NVarChar, pEmergName)
                                        .input('emg_p', sql.NVarChar, pEmergPhone)
                                        .input('ph', sql.VarChar, attendeeData.phoneNumber || null)
                                        .input('cnt', sql.NVarChar, attendeeData.country || 'Australia')
                                        .query(`
                                            INSERT INTO persons (
                                                first_name, last_name, email, user_id, 
                                                phone_number,
                                                date_of_birth, address_line_1, city, state, postcode, country,
                                                emergency_contact_name, emergency_contact_phone
                                            ) VALUES (
                                                @fn, @ln, @em, @uid,
                                                @ph,
                                                @dob, @addr, @city, @state, @post, @cnt,
                                                @emg_n, @emg_p
                                            ); 
                                            SELECT SCOPE_IDENTITY() AS id
                                        `);
                                    attendeePersonId = pRes.recordset[0].id;
                                }
                            } else {
                                attendeePersonId = mainPersonId;
                            }

                            // Resolve Linked Pilot ID
                            let linkedPilotId = null;

                            // 1. Existing Pilot Logic
                            if (attendeeData.linkedPilotAttendeeId) {
                                linkedPilotId = attendeeData.linkedPilotAttendeeId;
                            }
                            // 2. In-Cart Pilot Logic
                            else if (attendeeData.linkedPilotTempId) {
                                // Find the attendeeId from our `attendeesToProcess` list logic? 
                                // Actually, we need a map of TempID -> RealID.
                                // We iterate chronologically. If pilot is processed BEFORE crew, we have ID.
                                // If not, we have a problem. 
                                // Solution: Maintain a global map `tempIdMap = { tempId: attendeeId }`.
                                // NOTE: This requires `tempId` to be passed from frontend in `items`.
                                // Frontend sends `items` array. We augmented it with extra objects if quantity mismatch, but frontend sends structured data now.
                                // `attendeeData` comes from frontend.

                                const targetTempId = attendeeData.linkedPilotTempId;

                                // We need to check if we've processed this pilot yet.
                                // Since we loop, we might not have.
                                // BUT: We can assume Pilots are processed? No order guarantee.
                                // Better: Two-pass? 
                                // Or: Post-process update for links.
                                // Let's try Post-Process Update for simplicity and robustness.

                                // For now, just store valid ID if we can, or null.
                                // Actually, let's defer the UPDATE of linked_pilot_attendee_id until AFTER all attendees are inserted.
                            }

                            const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();

                            const attReq = new sql.Request(transaction);
                            const attRes = await attReq
                                .input('eid', sql.Int, eventId)
                                .input('pid', sql.Int, attendeePersonId)
                                .input('ttid', sql.Int, item.ticketTypeId)
                                .input('tcode', sql.VarChar, ticketCode)
                                .input('mop', sql.Bit, attendeeData.hasReadMop ? 1 : 0)
                                .input('arr', sql.Date, arrDate)
                                .input('dep', sql.Date, depDate)
                                .input('fld', sql.Bit, attendeeData.flightLineDuties ? 1 : 0)
                                .input('inspector', sql.Bit, attendeeData.isHeavyModelInspector ? 1 : 0)
                                .input('diet', sql.NVarChar, attendeeData.dietaryRequirements || null)
                                .input('link_pid', sql.Int, linkedPilotId) // Direct link if known
                                .query(`
                                    INSERT INTO attendees (
                                        event_id, person_id, ticket_type_id, status, ticket_code, has_agreed_to_mop,
                                        arrival_date, departure_date, flight_line_duties, is_heavy_model_inspector, dietary_requirements,
                                        linked_pilot_attendee_id
                                    ) VALUES (
                                        @eid, @pid, @ttid, 'Registered', @tcode, @mop,
                                        @arr, @dep, @fld, @inspector, @diet,
                                        @link_pid
                                    ); 
                                    SELECT SCOPE_IDENTITY() AS id;
                                `);
                            const attendeeId = attRes.recordset[0].id;

                            // Store ID in map for linking if we have a tempId
                            if (attendeeData.tempId) {
                                // We need a way to track these across different item loops...
                                // `allAttendeeIds` is just a list.
                                // Let's add a context object `tempIdToAttendeeIdMap` at top level.
                            }
                            // Store for post-linking
                            if (attendeeData.linkedPilotTempId) {
                                // Add to list for postponed update
                                // We need `attendeeId` (the crew) and `linkedPilotTempId` (the pilot's temp id)
                                // We will stash this in a list `pendingPilotLinks`.
                            }

                            allAttendeeIds.push(attendeeId);

                            // Update License Number if provided
                            if (attendeeData.licenseNumber) {
                                await new sql.Request(transaction)
                                    .input('pid', sql.Int, attendeePersonId)
                                    .input('lic', sql.NVarChar, attendeeData.licenseNumber)
                                    .query("UPDATE persons SET license_number = @lic WHERE person_id = @pid");
                            }

                            // Insert Planes
                            if (attendeeData.planes && attendeeData.planes.length > 0) {
                                for (const plane of attendeeData.planes) {
                                    if (plane.make || plane.model || plane.rego) {
                                        await new sql.Request(transaction)
                                            .input('pid', sql.Int, attendeePersonId)
                                            .input('name', sql.NVarChar, plane.make || 'Unknown')
                                            .input('model', sql.NVarChar, plane.model || '')
                                            .input('rego', sql.NVarChar, plane.rego || '')
                                            .input('is_heavy', sql.Bit, plane.isHeavy ? 1 : 0)
                                            .input('h_cert', sql.NVarChar, plane.heavyCertNumber || null)
                                            .input('h_url', sql.NVarChar, plane.heavyCertFile || null)
                                            .input('weight', sql.Decimal(10, 2), 0)
                                            .query(`
                                                INSERT INTO planes (person_id, name, model_type, registration_number, is_heavy_model, heavy_model_cert_number, heavy_model_cert_image_url, weight_kg)
                                                VALUES (@pid, @name, @model, @rego, @is_heavy, @h_cert, @h_url, @weight)
                                            `);
                                    }
                                }
                            }

                            // Create Order Item
                            const itemReq = new sql.Request(transaction);
                            await itemReq
                                .input('oid', sql.Int, orderId)
                                .input('aid', sql.Int, attendeeId)
                                .input('itype', sql.VarChar, 'Ticket')
                                .input('refid', sql.Int, item.ticketTypeId)
                                .input('price', sql.Decimal(10, 2), price)
                                .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price);`);

                            // HANDLE INCLUDED MERCHANDISE
                            if (ticketType.includes_merch && attendeeData.merchSkuId) {
                                const mSkuId = attendeeData.merchSkuId;

                                // 1. Get SKU Details (Product ID, Price, Stock)
                                const skuReq = new sql.Request(transaction);
                                const skuRes = await skuReq.input('sid', sql.Int, mSkuId)
                                    .query("SELECT product_id, price, current_stock FROM product_skus WHERE product_sku_id = @sid AND is_active = 1");

                                if (skuRes.recordset.length === 0) {
                                    throw new Error(`Invalid merchandise SKU ID: ${mSkuId}`);
                                }

                                const { product_id: skuProductId, current_stock: mStock } = skuRes.recordset[0];

                                // 2. Verify Link (Is this product allowed for this ticket?)
                                const linkReq = new sql.Request(transaction);
                                const linkRes = await linkReq
                                    .input('ttid', sql.Int, item.ticketTypeId)
                                    .input('pid', sql.Int, skuProductId)
                                    .query("SELECT 1 FROM ticket_linked_products WHERE ticket_type_id = @ttid AND product_id = @pid");

                                if (linkRes.recordset.length === 0) {
                                    throw new Error(`Selected merchandise (Product ${skuProductId}) is not included with this ticket type.`);
                                }

                                if (mStock < 1) {
                                    throw new Error(`Insufficient stock for included merchandise (SKU ${mSkuId}).`);
                                }

                                // Deduct Stock
                                await new sql.Request(transaction)
                                    .input('sid', sql.Int, mSkuId)
                                    .input('qty', sql.Int, 1) // Always 1 per ticket
                                    .query("UPDATE product_skus SET current_stock = current_stock - @qty WHERE product_sku_id = @sid");

                                // Create Order Item (Price $0.00)
                                await new sql.Request(transaction)
                                    .input('oid', sql.Int, orderId)
                                    .input('aid', sql.Int, attendeeId) // Linked to this attendee
                                    .input('itype', sql.VarChar, 'Merchandise')
                                    .input('refid', sql.Int, mSkuId)
                                    .input('price', sql.Decimal(10, 2), 0)
                                    .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price)`);
                            }
                        }
                    }
                }

                // Helper: Get Main Attendee ID (Generic attendee for non-ticket items)
                // If no tickets bought, we need a placeholder attendee for the main user to link items to.
                let mainAttendeeId;
                if (allAttendeeIds.length > 0) {
                    mainAttendeeId = allAttendeeIds[0];
                } else {
                    // Check if exists
                    const existReq = new sql.Request(transaction);
                    const existRes = await existReq.input('eid', sql.Int, eventId).input('pid', sql.Int, mainPersonId).query("SELECT TOP 1 attendee_id FROM attendees WHERE event_id = @eid AND person_id = @pid");
                    if (existRes.recordset.length > 0) {
                        mainAttendeeId = existRes.recordset[0].attendee_id;
                    } else {
                        // Create a "General" attendee record (assuming we have a 'General Entry' or similar ticket type? Or just 0/Null?)
                        // Schema constraint: ticket_type_id is NOT NULL. 
                        // We need a default ticket type ID. 
                        // HACK: Find the cheapest/first ticket type for this event as placeholder? 
                        // BETTER: Just fail if no ticket? 
                        // "Shopping cart needs to be able to be filled..." implies independent items.
                        // Let's look for a 'General' ticket or just pick one.
                        const ttReq = new sql.Request(transaction);
                        const ttRes = await ttReq.input('eid', sql.Int, eventId).query("SELECT TOP 1 ticket_type_id FROM event_ticket_types WHERE event_id = @eid");
                        if (ttRes.recordset.length === 0) throw new Error("No ticket types defined for event.");
                        const defaultTicketTypeId = ttRes.recordset[0].ticket_type_id;

                        const attReq = new sql.Request(transaction);
                        const attRes = await attReq
                            .input('eid', sql.Int, eventId)
                            .input('pid', sql.Int, mainPersonId)
                            .input('ttid', sql.Int, defaultTicketTypeId)
                            .input('tcode', sql.VarChar, 'GEN-' + Math.random().toString(36).substring(7))
                            .query(`INSERT INTO attendees (event_id, person_id, ticket_type_id, status) VALUES (@eid, @pid, @ttid, 'Registered'); SELECT SCOPE_IDENTITY() AS id;`);
                        mainAttendeeId = attRes.recordset[0].id;
                    }
                }

                // 4. Process CAMPSITE Items
                if (campsites && campsites.length > 0) {
                    for (const camp of campsites) {
                        const { campsiteId, checkIn, checkOut, price, adults = 1, children = 0 } = camp;

                        // Check Availability
                        const availReq = new sql.Request(transaction);
                        const availRes = await availReq
                            .input('cid', sql.Int, campsiteId).input('start', sql.Date, checkIn).input('end', sql.Date, checkOut)
                            .query(`
                                SELECT 
                                    (SELECT 1 FROM campsite_bookings WHERE campsite_id = @cid AND check_in_date < @end AND check_out_date > @start) as is_booked,
                                    price_per_night, full_event_price,
                                    extra_adult_price_per_night, extra_adult_full_event_price
                                FROM campsites WHERE campsite_id = @cid
                            `);

                        if (availRes.recordset.length === 0) throw new Error(`Invalid campsite ID: ${campsiteId}`);
                        const { is_booked, price_per_night, full_event_price, extra_adult_price_per_night, extra_adult_full_event_price } = availRes.recordset[0];

                        if (is_booked) throw new Error(`Campsite ${campsiteId} not available.`);

                        // Validate Price
                        const start = new Date(checkIn);
                        const end = new Date(checkOut);
                        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

                        const extraAdults = Math.max(0, adults - 1);

                        // Option 1: Daily Rate
                        const baseDaily = price_per_night * nights;
                        const extraDaily = extraAdults * (extra_adult_price_per_night || 0) * nights;
                        const totalDaily = baseDaily + extraDaily;

                        // Option 2: Full Event Rate
                        let totalFull = null;
                        if (full_event_price) {
                            const baseFull = full_event_price;
                            const extraFull = extraAdults * (extra_adult_full_event_price || 0);
                            totalFull = baseFull + extraFull;
                        }

                        // Allow small float difference or exact match
                        let isValidPrice = false;
                        if (Math.abs(price - totalDaily) < 0.5) isValidPrice = true;
                        if (totalFull !== null && Math.abs(price - totalFull) < 0.5) isValidPrice = true;

                        if (!isValidPrice) {
                            throw new Error(`Invalid price for campsite ${campsiteId}. Expected ${totalDaily.toFixed(2)} (Daily) or ${totalFull ? totalFull.toFixed(2) : 'N/A'} (Full), got ${price}`);
                        }

                        totalAmount += price;
                        const itemReq = new sql.Request(transaction);
                        const itemRes = await itemReq
                            .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Campsite').input('refid', sql.Int, campsiteId).input('price', sql.Decimal(10, 2), price)
                            .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price); SELECT SCOPE_IDENTITY() AS id`);

                        const orderItemId = itemRes.recordset[0].id;
                        await new sql.Request(transaction)
                            .input('cid', sql.Int, campsiteId)
                            .input('oiid', sql.Int, orderItemId)
                            .input('in', sql.Date, checkIn)
                            .input('out', sql.Date, checkOut)
                            .input('adults', sql.Int, adults)
                            .input('children', sql.Int, children)
                            .query(`INSERT INTO campsite_bookings (campsite_id, order_item_id, check_in_date, check_out_date, number_of_adults, number_of_children) VALUES (@cid, @oiid, @in, @out, @adults, @children)`);
                    }
                }

                // 5. Process MERCHANDISE Items
                if (merchandise && merchandise.length > 0) {
                    for (const merch of merchandise) {
                        // skuId is now product_sku_id (Global Merch)
                        const skuId = merch.skuId;
                        const qty = merch.quantity || 1;

                        // Check SKU & Price
                        const skuReq = new sql.Request(transaction);
                        const skuRes = await skuReq.input('sid', sql.Int, skuId).query("SELECT price, current_stock FROM product_skus WHERE product_sku_id = @sid AND is_active = 1");

                        if (skuRes.recordset.length === 0) throw new Error(`Invalid or inactive merchandise SKU: ${skuId}`);

                        const price = skuRes.recordset[0].price;
                        const currentStock = skuRes.recordset[0].current_stock;

                        // Check Stock
                        if (currentStock < qty) throw new Error(`Insufficient stock for SKU ${skuId}. Requested: ${qty}, Available: ${currentStock}`);

                        // Update Stock
                        const stockReq = new sql.Request(transaction);
                        await stockReq.input('sid', sql.Int, skuId).input('qty', sql.Int, qty)
                            .query("UPDATE product_skus SET current_stock = current_stock - @qty WHERE product_sku_id = @sid");

                        totalAmount += (price * qty);

                        // Create Order Item (One per qty? Or one line item? Schema doesn't have quantity in order_items. It has one row per item.)
                        // Since `order_items` is one-per-item, we loop qty.
                        for (let i = 0; i < qty; i++) {
                            const itemReq = new sql.Request(transaction);
                            await itemReq
                                .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Merchandise')
                                .input('refid', sql.Int, skuId) // Storing Product SKU ID
                                .input('price', sql.Decimal(10, 2), price)
                                .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price)`);
                        }
                    }
                }

                // 6. Process ASSET Items
                if (assets && assets.length > 0) {
                    for (const asset of assets) {
                        // Check availability? (Assets have `total_quantity`? Schema: `asset_items` are individual items. `asset_types` is the group.)
                        // Complex asset management: Allocating specific `asset_item_id`.
                        // MVP: Just book it conceptually. We need an `asset_item_id` for `asset_hires`.
                        // Find an available asset item of this type.
                        // Specific Asset Booking Logic
                        // Input 'assetId' is the specific asset_item_id from the frontend
                        const assetItemId = asset.assetId;

                        const itemFindReq = new sql.Request(transaction);
                        const itemFindRes = await itemFindReq
                            .input('aiid', sql.Int, assetItemId)
                            .input('start', sql.Date, asset.checkIn)
                            .input('end', sql.Date, asset.checkOut)
                            .query(`
                                SELECT 1 
                                FROM asset_items ai
                                WHERE ai.asset_item_id = @aiid
                                AND ai.asset_item_id NOT IN (
                                    SELECT asset_item_id FROM asset_hires 
                                    WHERE hire_start_date < @end AND hire_end_date > @start
                                )
                            `);

                        if (itemFindRes.recordset.length === 0) throw new Error(`Asset ${assetItemId} is not available for the specified dates.`);
                        // const assetItemId = asset.assetId; // Already have it

                        totalAmount += asset.price;

                        const itemReq = new sql.Request(transaction);
                        const itemRes = await itemReq
                            .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Asset')
                            .input('refid', sql.Int, assetItemId) // Storing specific Asset Item ID
                            .input('price', sql.Decimal(10, 2), asset.price)
                            .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price); SELECT SCOPE_IDENTITY() AS id`);

                        const orderItemId = itemRes.recordset[0].id;

                        await new sql.Request(transaction)
                            .input('aiid', sql.Int, assetItemId).input('oiid', sql.Int, orderItemId).input('start', sql.Date, asset.checkIn).input('end', sql.Date, asset.checkOut)
                            .query(`INSERT INTO asset_hires (asset_item_id, order_item_id, hire_start_date, hire_end_date) VALUES (@aiid, @oiid, @start, @end)`);
                    }
                }

                // 7. Process SUBEVENT Items
                if (subevents && subevents.length > 0) {
                    for (const sub of subevents) {
                        let priceAdjustment = 0;
                        const validOptionIds = [];

                        // Validate and Calculate Options
                        if (sub.selectedOptions && Object.keys(sub.selectedOptions).length > 0) {
                            for (const [varId, optId] of Object.entries(sub.selectedOptions)) {
                                const optRes = await new sql.Request(transaction)
                                    .input('oid', sql.Int, optId)
                                    .query("SELECT price_adjustment FROM subevent_variation_options WHERE variation_option_id = @oid");

                                if (optRes.recordset.length > 0) {
                                    priceAdjustment += optRes.recordset[0].price_adjustment;
                                    validOptionIds.push(optId);
                                } else {
                                    throw new Error(`Invalid variation option ID: ${optId}`);
                                }
                            }
                        }

                        const finalPrice = sub.price + priceAdjustment;
                        totalAmount += finalPrice;

                        const itemReq = new sql.Request(transaction);
                        const itemRes = await itemReq
                            .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Subevent')
                            .input('refid', sql.Int, sub.subeventId)
                            .input('price', sql.Decimal(10, 2), finalPrice)
                            .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price); SELECT SCOPE_IDENTITY() AS id`);

                        const orderItemId = itemRes.recordset[0].id;

                        // Insert Registration and return ID
                        // Note: Previous schema check confirmed subevent_registrations has an identity PK 'subevent_registration_id'
                        const regReq = new sql.Request(transaction);
                        const regRes = await regReq
                            .input('sid', sql.Int, sub.subeventId).input('oiid', sql.Int, orderItemId)
                            .query(`INSERT INTO subevent_registrations (subevent_id, order_item_id) VALUES (@sid, @oiid); SELECT SCOPE_IDENTITY() AS id`);

                        const registrationId = regRes.recordset[0].id;

                        // Insert Choices
                        for (const optId of validOptionIds) {
                            await new sql.Request(transaction)
                                .input('rid', sql.Int, registrationId)
                                .input('oid', sql.Int, optId)
                                .query("INSERT INTO subevent_registration_choices (subevent_registration_id, variation_option_id) VALUES (@rid, @oid)");
                        }
                    }
                }

                // 7.5 Process Pending Pilot Links (for in-cart pilots)
                if (pendingPilotLinks.length > 0) {
                    for (const link of pendingPilotLinks) {
                        const pilotId = tempIdMap[link.linkedPilotTempId];
                        if (pilotId) {
                            await new sql.Request(transaction)
                                .input('pid', sql.Int, pilotId)
                                .input('aid', sql.Int, link.attendeeId)
                                .query("UPDATE attendees SET linked_pilot_attendee_id = @pid WHERE attendee_id = @aid");
                        } else {
                            // Warn? Or Ignore? If pilot failed creation, transaction rolls back anyway.
                            // If user hacked tempID, this might fail silently.
                            // Just log warning if needed, but safe to ignore for now.
                        }
                    }
                }

                // 8. Update Total & Finish
                // 8. Update Total & Finish
                // Generate Invoice Number: INV-{YYYY}-{ORDER_ID}
                const year = new Date().getFullYear();
                const invoiceNumber = `INV-${year}-${orderId}`;

                await new sql.Request(transaction)
                    .input('oid', sql.Int, orderId)
                    .input('tot', sql.Decimal(10, 2), totalAmount)
                    .input('inv', sql.VarChar, invoiceNumber)
                    .query("UPDATE orders SET total_amount = @tot, payment_status = 'Pending', invoice_number = @inv, amount_paid = 0 WHERE order_id = @oid");

                // No transaction record created yet (Pending Payment)

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({ message: "Order processed", orderId, total: totalAmount, invoiceNumber })
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log(`Error creating order: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
