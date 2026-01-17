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
                    .query("INSERT INTO orders (user_id, total_amount, payment_status) VALUES (@uid, 0, 'Pending'); SELECT SCOPE_IDENTITY() AS id");

                const orderId = orderRes.recordset[0].id;
                let totalAmount = 0;
                let allAttendeeIds = [];

                // 3. Process TICKET Items (Create Attendees)
                if (items && items.length > 0) {
                    for (const item of items) {
                        const ticketReq = new sql.Request(transaction);
                        const ticketRes = await ticketReq.input('tt_id', sql.Int, item.ticketTypeId)
                            .query("SELECT price, system_role, is_pilot FROM event_ticket_types WHERE ticket_type_id = @tt_id");

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

                            if (safeUserEmail && safeAttendeeEmail && safeUserEmail === safeAttendeeEmail) {
                                attendeePersonId = mainPersonId;
                            } else if (attendeeData.firstName || attendeeData.lastName || safeAttendeeEmail) {
                                const pReq = new sql.Request(transaction);
                                const pRes = await pReq
                                    .input('fn', sql.NVarChar, attendeeData.firstName || 'Guest')
                                    .input('ln', sql.NVarChar, attendeeData.lastName || 'User')
                                    .input('em', sql.NVarChar, attendeeData.email || null)
                                    .input('uid', sql.Int, user.userId)
                                    .query(`INSERT INTO persons (first_name, last_name, email, user_id) VALUES (@fn, @ln, @em, @uid); SELECT SCOPE_IDENTITY() AS id`);
                                attendeePersonId = pRes.recordset[0].id;
                            } else {
                                attendeePersonId = mainPersonId;
                            }

                            // Create Attendee
                            const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                            const attReq = new sql.Request(transaction);
                            const attRes = await attReq
                                .input('eid', sql.Int, eventId)
                                .input('pid', sql.Int, attendeePersonId)
                                .input('ttid', sql.Int, item.ticketTypeId)
                                .input('tcode', sql.VarChar, ticketCode)
                                .query(`INSERT INTO attendees (event_id, person_id, ticket_type_id, status, ticket_code) VALUES (@eid, @pid, @ttid, 'Registered', @tcode); SELECT SCOPE_IDENTITY() AS id;`);
                            const attendeeId = attRes.recordset[0].id;
                            allAttendeeIds.push(attendeeId);

                            // Create Order Item
                            const itemReq = new sql.Request(transaction);
                            await itemReq
                                .input('oid', sql.Int, orderId)
                                .input('aid', sql.Int, attendeeId)
                                .input('itype', sql.VarChar, 'Ticket')
                                .input('refid', sql.Int, item.ticketTypeId)
                                .input('price', sql.Decimal(10, 2), price)
                                .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price);`);
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
                        const { campsiteId, checkIn, checkOut, price } = camp;

                        // Check Availability
                        const availReq = new sql.Request(transaction);
                        const availRes = await availReq
                            .input('cid', sql.Int, campsiteId).input('start', sql.Date, checkIn).input('end', sql.Date, checkOut)
                            .query(`
                                SELECT 
                                    (SELECT 1 FROM campsite_bookings WHERE campsite_id = @cid AND check_in_date < @end AND check_out_date > @start) as is_booked,
                                    price_per_night, full_event_price 
                                FROM campsites WHERE campsite_id = @cid
                            `);

                        if (availRes.recordset.length === 0) throw new Error(`Invalid campsite ID: ${campsiteId}`);
                        const { is_booked, price_per_night, full_event_price } = availRes.recordset[0];

                        if (is_booked) throw new Error(`Campsite ${campsiteId} not available.`);

                        // Validate Price
                        const start = new Date(checkIn);
                        const end = new Date(checkOut);
                        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        const dailyTotal = price_per_night * nights;

                        // Allow small float difference or exact match
                        // User price must match either Daily Total OR Full Event Price
                        let isValidPrice = false;
                        if (Math.abs(price - dailyTotal) < 0.5) isValidPrice = true;
                        if (full_event_price && Math.abs(price - full_event_price) < 0.5) isValidPrice = true;

                        // Identify if "Full Event" was used for tracking? 
                        // For now just validate. If they paid full event price, that's fine.

                        if (!isValidPrice) {
                            throw new Error(`Invalid price for campsite ${campsiteId}. Expected ${dailyTotal} or ${full_event_price}, got ${price}`);
                        }

                        totalAmount += price;
                        const itemReq = new sql.Request(transaction);
                        const itemRes = await itemReq
                            .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Campsite').input('refid', sql.Int, campsiteId).input('price', sql.Decimal(10, 2), price)
                            .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price); SELECT SCOPE_IDENTITY() AS id`);

                        const orderItemId = itemRes.recordset[0].id;
                        await new sql.Request(transaction)
                            .input('cid', sql.Int, campsiteId).input('oiid', sql.Int, orderItemId).input('in', sql.Date, checkIn).input('out', sql.Date, checkOut)
                            .query(`INSERT INTO campsite_bookings (campsite_id, order_item_id, check_in_date, check_out_date) VALUES (@cid, @oiid, @in, @out)`);
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
                        const itemFindReq = new sql.Request(transaction);
                        // Find item not hired during these dates
                        const itemFindRes = await itemFindReq
                            .input('atid', sql.Int, asset.assetId)
                            .input('start', sql.Date, asset.checkIn)
                            .input('end', sql.Date, asset.checkOut)
                            .query(`
                                SELECT TOP 1 ai.asset_item_id 
                                FROM asset_items ai
                                WHERE ai.asset_type_id = @atid
                                AND ai.asset_item_id NOT IN (
                                    SELECT asset_item_id FROM asset_hires 
                                    WHERE hire_start_date < @end AND hire_end_date > @start
                                )
                            `);

                        if (itemFindRes.recordset.length === 0) throw new Error(`No assets available for specified dates.`);
                        const assetItemId = itemFindRes.recordset[0].asset_item_id;

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
                        totalAmount += sub.price;

                        const itemReq = new sql.Request(transaction);
                        const itemRes = await itemReq
                            .input('oid', sql.Int, orderId).input('aid', sql.Int, mainAttendeeId).input('itype', sql.VarChar, 'Subevent')
                            .input('refid', sql.Int, sub.subeventId)
                            .input('price', sql.Decimal(10, 2), sub.price)
                            .query(`INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase) VALUES (@oid, @aid, @itype, @refid, @price); SELECT SCOPE_IDENTITY() AS id`);

                        const orderItemId = itemRes.recordset[0].id;

                        await new sql.Request(transaction)
                            .input('sid', sql.Int, sub.subeventId).input('oiid', sql.Int, orderItemId)
                            .query(`INSERT INTO subevent_registrations (subevent_id, order_item_id) VALUES (@sid, @oiid)`);
                    }
                }

                // 8. Update Total & Finish
                await new sql.Request(transaction).input('oid', sql.Int, orderId).input('tot', sql.Decimal(10, 2), totalAmount).query("UPDATE orders SET total_amount = @tot, payment_status = 'Paid' WHERE order_id = @oid");
                await new sql.Request(transaction).input('oid', sql.Int, orderId).input('tot', sql.Decimal(10, 2), totalAmount).query("INSERT INTO transactions (order_id, amount, payment_method, status, timestamp) VALUES (@oid, @tot, 'Mock', 'Success', GETUTCDATE())");

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({ message: "Order processed", orderId, total: totalAmount })
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
