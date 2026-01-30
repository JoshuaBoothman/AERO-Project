const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('deleteOrder', {
    methods: ['DELETE'],
    route: 'orders/{id}',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const orderId = request.params.id;
        const user = validateToken(request);

        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Verify Order Ownership and Status
                const orderCheckReq = new sql.Request(transaction);
                const orderCheckRes = await orderCheckReq
                    .input('oid', sql.Int, orderId)
                    .input('uid', sql.Int, user.userId)
                    .query("SELECT user_id, payment_status FROM orders WHERE order_id = @oid");

                if (orderCheckRes.recordset.length === 0) {
                    throw new Error("Order not found.");
                }

                const order = orderCheckRes.recordset[0];
                if (order.user_id !== user.userId) {
                    throw new Error("Unauthorized access to order.");
                }
                if (order.payment_status !== 'Pending') {
                    throw new Error("Only pending orders can be deleted.");
                }

                // 2. Identify Items to Clean Up
                const itemsReq = new sql.Request(transaction);
                const itemsRes = await itemsReq
                    .input('oid', sql.Int, orderId)
                    .query(`
                        SELECT oi.order_item_id, oi.item_type, oi.item_reference_id, oi.attendee_id,
                               (SELECT COUNT(*) FROM order_items WHERE order_id = @oid AND item_reference_id = oi.item_reference_id AND item_type = 'Merchandise') as merch_qty
                        FROM order_items oi
                        WHERE oi.order_id = @oid
                    `);

                const orderItems = itemsRes.recordset;
                const orderItemIds = orderItems.map(i => i.order_item_id);

                // 3. Delete Linked Resources (Campsites, Assets, Subevents)
                if (orderItemIds.length > 0) {
                    // Because we can't pass array directly to IN clause easily in plain SQL via inputs without Table Valued Parameters,
                    // and complexity is low (one user order), we can iterate or delete by subquery on order_id if schema links allowing join.
                    // But standard schema is campsite_bookings -> order_item_id.
                    // Easier: DELETE FROM campsite_bookings WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = @oid)

                    const cleanupReq = new sql.Request(transaction);
                    await cleanupReq.input('oid', sql.Int, orderId).query(`
                        DELETE FROM campsite_bookings WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = @oid);
                        DELETE FROM asset_hires WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = @oid);
                        DELETE FROM subevent_registrations WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = @oid);
                        -- Note: subevent_registration_choices cascades from registrations usually? 
                        -- If not, we might need to delete them first. Let's assume cascade or added check.
                        -- Actually, let's play safe and delete choices first via join.
                        DELETE src FROM subevent_registration_choices src
                        INNER JOIN subevent_registrations sr ON src.subevent_registration_id = sr.subevent_registration_id
                        INNER JOIN order_items oi ON sr.order_item_id = oi.order_item_id
                        WHERE oi.order_id = @oid;
                    `);
                }

                // 4. Restore Merchandise Stock
                // We need to group purely by SKU to sum up quantities restored.
                // Filter distinct Loop? Or logic map.
                const merchItems = orderItems.filter(i => i.item_type === 'Merchandise');
                const processedSkus = new Set();

                for (const item of merchItems) {
                    if (!processedSkus.has(item.item_reference_id)) {
                        // Count how many times this SKU appears in THIS order
                        // (Usually 1 row per item implies quantity 1 per row, or we grouped earlier?)
                        // `createOrder` inserts 1 row per qty.
                        // So we count rows for this SKU.
                        const qty = merchItems.filter(m => m.item_reference_id === item.item_reference_id).length;

                        await new sql.Request(transaction)
                            .input('sid', sql.Int, item.item_reference_id)
                            .input('qty', sql.Int, qty)
                            .query("UPDATE product_skus SET current_stock = current_stock + @qty WHERE product_sku_id = @sid");

                        processedSkus.add(item.item_reference_id);
                    }
                }

                // 5. Cancel Attendees (Tickets)
                // Filter unique attendees linked to TICKET items in this order
                const ticketItems = orderItems.filter(i => i.item_type === 'Ticket');
                const attendeeIdsToCancel = [...new Set(ticketItems.map(i => i.attendee_id))];

                for (const aid of attendeeIdsToCancel) {
                    await new sql.Request(transaction)
                        .input('aid', sql.Int, aid)
                        .query("UPDATE attendees SET status = 'Cancelled' WHERE attendee_id = @aid");
                }

                // 6. Delete Order Items then Order
                const delReq = new sql.Request(transaction);
                await delReq.input('oid', sql.Int, orderId).query(`
                    DELETE FROM order_items WHERE order_id = @oid;
                    DELETE FROM orders WHERE order_id = @oid;
                `);

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({ message: "Order deleted successfully." })
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log(`Error deleting order: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
