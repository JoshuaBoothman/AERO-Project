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
            const request = new sql.Request(transaction);

            try {
                // 1. Get or Create Person ID for the User
                let personCheck = await request.input('u_id', sql.Int, user.userId)
                    .query("SELECT person_id FROM persons WHERE user_id = @u_id");
                
                let personId;
                if (personCheck.recordset.length > 0) {
                    personId = personCheck.recordset[0].person_id;
                } else {
                    // Create person record if not exists (Basic info from what we have)
                    const personInsert = new sql.Request(transaction);
                    const pRes = await personInsert
                        .input('uid', sql.Int, user.userId)
                        .input('email', sql.NVarChar, user.email || 'unknown@example.com') 
                        .query("INSERT INTO persons (user_id, email, first_name, last_name) VALUES (@uid, @email, 'Unknown', 'User'); SELECT SCOPE_IDENTITY() AS id");
                    personId = pRes.recordset[0].id;
                }

                // 2. Create Order Header
                const orderReq = new sql.Request(transaction);
                const orderRes = await orderReq
                    .input('p_id', sql.Int, personId)
                    .input('e_id', sql.Int, eventId)
                    .query("INSERT INTO orders (person_id, event_id, order_date, total_amount, payment_status) VALUES (@p_id, @e_id, GETUTCDATE(), 0, 'Pending'); SELECT SCOPE_IDENTITY() AS id");
                
                const orderId = orderRes.recordset[0].id;
                let totalAmount = 0;

                // 3. Process Items & Attendees
                for (const item of items) {
                    // Get price for this ticket type
                    const priceReq = new sql.Request(transaction);
                    const priceRes = await priceReq.input('tt_id', sql.Int, item.ticketTypeId)
                        .query("SELECT price FROM event_ticket_types WHERE ticket_type_id = @tt_id");
                    
                    if (priceRes.recordset.length === 0) throw new Error(`Invalid ticket type: ${item.ticketTypeId}`);
                    
                    const price = priceRes.recordset[0].price;
                    const itemTotal = price * item.quantity;
                    totalAmount += itemTotal;

                    // Insert Order Item
                    const itemReq = new sql.Request(transaction);
                    const itemRes = await itemReq
                        .input('o_id', sql.Int, orderId)
                        .input('tt_id', sql.Int, item.ticketTypeId)
                        .input('qty', sql.Int, item.quantity)
                        .input('price', sql.Decimal(10, 2), price)
                        .query("INSERT INTO order_items (order_id, ticket_type_id, quantity, price) VALUES (@o_id, @tt_id, @qty, @price); SELECT SCOPE_IDENTITY() AS id");
                    
                    const orderItemId = itemRes.recordset[0].id;

                    // Insert Attendees (NEW)
                    if (item.attendees && item.attendees.length > 0) {
                        for (const attendee of item.attendees) {
                            const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase(); // Simple 8-char code
                            
                            const attReq = new sql.Request(transaction);
                            await attReq
                                .input('oi_id', sql.Int, orderItemId)
                                .input('fn', sql.NVarChar, attendee.firstName)
                                .input('ln', sql.NVarChar, attendee.lastName)
                                .input('em', sql.NVarChar, attendee.email)
                                .input('code', sql.NVarChar, ticketCode)
                                .query(`
                                    INSERT INTO attendees (order_item_id, first_name, last_name, email, ticket_code, status)
                                    VALUES (@oi_id, @fn, @ln, @em, @code, 'Registered')
                                `);
                        }
                    }
                }

                // 4. Update Order Total
                const totalReq = new sql.Request(transaction);
                await totalReq
                    .input('oid', sql.Int, orderId)
                    .input('total', sql.Decimal(10, 2), totalAmount)
                    .query("UPDATE orders SET total_amount = @total WHERE order_id = @oid");

                // 5. Create Mock Transaction
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