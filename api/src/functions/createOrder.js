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
        // items expected structure: [{ ticketTypeId: 1, quantity: 2 }]

        if (!items || items.length === 0) {
            return { status: 400, body: JSON.stringify({ error: "No items in cart" }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            
            await transaction.begin();
            const request = new sql.Request(transaction);

            try {
                // 1. Get or Create Person ID for the User
                let personCheck = await request.input('u_id', sql.Int, user.userId)
                    .query("SELECT person_id FROM persons WHERE user_id = @u_id");
                
                let personId;
                if (personCheck.recordset.length > 0) {
                    personId = personCheck.recordset[0].person_id;
                } else {
                    // Create a person record if missing
                    // We need user details first to populate Person table
                    // Note: We need a separate request/query here that is NOT part of the transaction 
                    // if we wanted to be purely read-only, but it's fine to be in it.
                    // However, we can't reuse the 'request' object for a different query easily in mssql 
                    // without clearing parameters. Let's make new Request objects for each query.
                    
                    const userDetailsReq = new sql.Request(transaction);
                    const userDetails = await userDetailsReq.input('uid', sql.Int, user.userId)
                        .query("SELECT first_name, last_name, email FROM users WHERE user_id = @uid");
                    
                    const u = userDetails.recordset[0];
                    
                    const pReq = new sql.Request(transaction);
                    const pRes = await pReq
                        .input('uid', sql.Int, user.userId)
                        .input('fname', sql.NVarChar, u.first_name)
                        .input('lname', sql.NVarChar, u.last_name)
                        .input('email', sql.NVarChar, u.email)
                        .query(`
                            INSERT INTO persons (user_id, first_name, last_name, email, created_at)
                            OUTPUT INSERTED.person_id
                            VALUES (@uid, @fname, @lname, @email, GETUTCDATE())
                        `);
                    personId = pRes.recordset[0].person_id;
                }

                // 2. Calculate Totals & Validate Ticket Types
                let totalAmount = 0;
                const processItems = []; 

                for (const item of items) {
                    const tReq = new sql.Request(transaction);
                    const tRes = await tReq.input('tid', sql.Int, item.ticketTypeId)
                        .query("SELECT price, name FROM event_ticket_types WHERE ticket_type_id = @tid");
                    
                    if (tRes.recordset.length === 0) throw new Error(`Invalid Ticket Type ID: ${item.ticketTypeId}`);
                    
                    const price = tRes.recordset[0].price;
                    totalAmount += (price * item.quantity);
                    
                    for(let i=0; i < item.quantity; i++) {
                        processItems.push({
                            ticketTypeId: item.ticketTypeId,
                            price: price
                        });
                    }
                }

                // 3. Create Order
                const orderReq = new sql.Request(transaction);
                const orderRes = await orderReq
                    .input('user_id', sql.Int, user.userId)
                    .input('total', sql.Decimal(10, 2), totalAmount)
                    .query(`
                        INSERT INTO orders (user_id, total_amount, payment_status, order_date)
                        OUTPUT INSERTED.order_id
                        VALUES (@user_id, @total, 'Unpaid', GETUTCDATE())
                    `);
                
                const orderId = orderRes.recordset[0].order_id;

                // 4. Create Attendees & Order Items
                for (const pItem of processItems) {
                    // A. Create Attendee
                    const attReq = new sql.Request(transaction);
                    const attRes = await attReq
                        .input('evt_id', sql.Int, eventId)
                        .input('per_id', sql.Int, personId)
                        .input('tt_id', sql.Int, pItem.ticketTypeId)
                        .query(`
                            INSERT INTO attendees (event_id, person_id, ticket_type_id, status, created_at)
                            OUTPUT INSERTED.attendee_id
                            VALUES (@evt_id, @per_id, @tt_id, 'Registered', GETUTCDATE())
                        `);
                    
                    const attendeeId = attRes.recordset[0].attendee_id;

                    // B. Create Order Item
                    const oiReq = new sql.Request(transaction);
                    await oiReq
                        .input('oid', sql.Int, orderId)
                        .input('aid', sql.Int, attendeeId)
                        .input('ref', sql.Int, pItem.ticketTypeId)
                        .input('price', sql.Decimal(10, 2), pItem.price)
                        .query(`
                            INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase, fulfillment_status)
                            VALUES (@oid, @aid, 'Ticket', @ref, @price, 'Fulfilled')
                        `);
                }

                // 5. Mock Payment Transaction
                const transReq = new sql.Request(transaction);
                await transReq
                    .input('oid', sql.Int, orderId)
                    .input('amt', sql.Decimal(10, 2), totalAmount)
                    .query(`
                        INSERT INTO transactions (order_id, amount, payment_method, status, timestamp)
                        VALUES (@oid, @amt, 'Credit Card (Mock)', 'Success', GETUTCDATE())
                    `);

                // 6. Update Order Status
                const updateReq = new sql.Request(transaction);
                await updateReq.input('oid', sql.Int, orderId)
                    .query("UPDATE orders SET payment_status = 'Paid' WHERE order_id = @oid");

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