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

        const { eventId, items } = await request.json();
        // items structure: [{ ticketTypeId: 1, quantity: 2, attendees: [{ firstName, lastName, email }, ...] }]

        if (!items || items.length === 0) {
            return { status: 400, body: JSON.stringify({ error: "No items in cart" }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);

            await transaction.begin();

            try {
                // 1. Get or Create Person ID for the MAIN User (Order Owner)
                // This person_id will be used for the main user's attendee record and potentially as a fallback for planes.
                const mainUserPersonReq = new sql.Request(transaction);
                let personCheck = await mainUserPersonReq.input('u_id', sql.Int, user.userId)
                    .query("SELECT person_id FROM persons WHERE user_id = @u_id");

                let mainPersonId;
                if (personCheck.recordset.length > 0) {
                    mainPersonId = personCheck.recordset[0].person_id;
                } else {
                    // Create person record if not exists (Basic info from what we have)
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

                // 3. Process Items & Attendees
                for (const item of items) {
                    // Get ticket details
                    const ticketReq = new sql.Request(transaction);
                    const ticketRes = await ticketReq.input('tt_id', sql.Int, item.ticketTypeId)
                        .query("SELECT price, system_role, is_pilot FROM event_ticket_types WHERE ticket_type_id = @tt_id");

                    if (ticketRes.recordset.length === 0) throw new Error(`Invalid ticket type: ${item.ticketTypeId}`);

                    const ticketType = ticketRes.recordset[0];
                    const price = ticketType.price;

                    // Ensure we have attendee data for each quantity
                    // If specific attendee details are provided, use them. Otherwise, create generic placeholders.
                    const attendeesToProcess = item.attendees && item.attendees.length > 0
                        ? item.attendees
                        : Array(item.quantity).fill({}); // Fallback for quantity if no specific attendees

                    for (const attendeeData of attendeesToProcess) {
                        totalAmount += price;

                        // A. Create/Get Person for this specific Attendee
                        let attendeePersonId;
                        const safeUserEmail = (user.email || '').toLowerCase();
                        const safeAttendeeEmail = (attendeeData.email || '').toLowerCase();

                        if (safeUserEmail && safeAttendeeEmail && safeUserEmail === safeAttendeeEmail) {
                            // If attendee email matches the main user, use the main user's person_id
                            attendeePersonId = mainPersonId;
                        } else if (attendeeData.firstName || attendeeData.lastName || safeAttendeeEmail) {
                            // If specific attendee details are provided (and it's not the main user), create a new Person record
                            const pReq = new sql.Request(transaction);
                            const pRes = await pReq
                                .input('fn', sql.NVarChar, attendeeData.firstName || 'Guest')
                                .input('ln', sql.NVarChar, attendeeData.lastName || 'User')
                                .input('em', sql.NVarChar, attendeeData.email || null)
                                .query(`
                                    INSERT INTO persons (first_name, last_name, email)
                                    VALUES (@fn, @ln, @em);
                                    SELECT SCOPE_IDENTITY() AS id
                                `);
                            attendeePersonId = pRes.recordset[0].id;
                        } else {
                            // If no specific attendee data, default to the main user's person_id
                            attendeePersonId = mainPersonId;
                        }

                        // B. Create Attendee Record
                        // Schema: attendee_id, event_id, person_id, ticket_type_id, status
                        const attReq = new sql.Request(transaction);
                        const attRes = await attReq
                            .input('eid', sql.Int, eventId)
                            .input('pid', sql.Int, attendeePersonId)
                            .input('ttid', sql.Int, item.ticketTypeId)
                            .query(`
                                INSERT INTO attendees (event_id, person_id, ticket_type_id, status)
                                VALUES (@eid, @pid, @ttid, 'Registered');
                                SELECT SCOPE_IDENTITY() AS id;
                            `);
                        const attendeeId = attRes.recordset[0].id;

                        // C. Create Order Item
                        // Schema: order_item_id, order_id, attendee_id, item_type, item_reference_id, price_at_purchase
                        const itemReq = new sql.Request(transaction);
                        await itemReq
                            .input('oid', sql.Int, orderId)
                            .input('aid', sql.Int, attendeeId)
                            .input('itype', sql.VarChar, 'Ticket') // Assuming 'Ticket' is a valid item_type
                            .input('refid', sql.Int, item.ticketTypeId) // Linking back to ticket type
                            .input('price', sql.Decimal(10, 2), price)
                            .query(`
                                INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase)
                                VALUES (@oid, @aid, @itype, @refid, @price);
                            `);

                        // D. Handle Pilot Specific Data (Planes)
                        if (ticketType.is_pilot && attendeeData.planes && Array.isArray(attendeeData.planes)) {
                            for (const plane of attendeeData.planes) {
                                // Insert Plane (linked to the attendee's person_id)
                                const planeReq = new sql.Request(transaction);
                                const planeRes = await planeReq
                                    .input('pid', sql.Int, attendeePersonId) // Owner is the attendee's person
                                    .input('name', sql.NVarChar, plane.make || 'Unknown') // Mapping 'make' to 'name'
                                    .input('model', sql.NVarChar, plane.model || 'Unknown') // Mapping 'model' to 'model_type'
                                    .input('rego', sql.NVarChar, plane.rego || '')
                                    .query(`
                                        INSERT INTO planes (person_id, name, model_type, registration_number, weight_kg)
                                        VALUES (@pid, @name, @model, @rego, 0); -- Default weight_kg to 0
                                        SELECT SCOPE_IDENTITY() AS id;
                                    `);
                                const planeId = planeRes.recordset[0].id;

                                // Link Plane to Event
                                const epReq = new sql.Request(transaction);
                                await epReq
                                    .input('eid', sql.Int, eventId)
                                    .input('plid', sql.Int, planeId)
                                    .query("INSERT INTO event_planes (event_id, plane_id) VALUES (@eid, @plid)");
                            }
                        }

                        // E. Handle Crew Linking
                        // TODO: Implement crew linking. This requires a 'ticket_code' column in the attendees table
                        // or a similar mechanism for lookup, which is not currently in the schema.
                        // For now, this logic is skipped to avoid schema errors.
                        // if (attendeeData.linkedPilotCode) {
                        //     const linkReq = new sql.Request(transaction);
                        //     await linkReq.input('code', sql.NVarChar, attendeeData.linkedPilotCode)
                        //         .input('cid', sql.Int, attendeeId)
                        //         .query(`
                        //             INSERT INTO pilot_pit_crews (pilot_attendee_id, crew_attendee_id)
                        //             SELECT id, @cid FROM attendees WHERE ticket_code = @code
                        //         `);
                        // }
                    }
                }

                // 4. Update Order Total & Status
                const totalReq = new sql.Request(transaction);
                await totalReq
                    .input('oid', sql.Int, orderId)
                    .input('total', sql.Decimal(10, 2), totalAmount)
                    .query("UPDATE orders SET total_amount = @total, payment_status = 'Paid' WHERE order_id = @oid");

                // 5. Create Mock Transaction Record
                const transReq = new sql.Request(transaction);
                await transReq
                    .input('oid', sql.Int, orderId)
                    .input('amt', sql.Decimal(10, 2), totalAmount)
                    .query(`
                        INSERT INTO transactions (order_id, amount, payment_method, status, timestamp)
                        VALUES (@oid, @amt, 'Credit Card (Mock)', 'Success', GETUTCDATE())
                    `);

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({
                        message: "Order processed successfully",
                        orderId: orderId,
                        total: totalAmount
                    })
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log(`Error creating order: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Transaction failed", details: error.message })
            };
        }
    }
});