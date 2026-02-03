const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('refundOrderItem', {
    methods: ['POST'],
    route: 'orders/{orderId}/items/{itemId}/refund',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const decoded = validateToken(request);
        if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'Operational')) {
            return { status: 403, body: "Forbidden: Admin access required." };
        }

        const { orderId, itemId } = request.params;

        // Default to 'refund', but allow 'unrefund'
        let { action } = await request.json().catch(() => ({}));
        if (!action) action = 'refund';

        try {
            // 1. Check if item exists and get status
            const itemQuery = `
                SELECT order_item_id, item_type, item_reference_id, refunded_at, quantity 
                FROM order_items 
                WHERE order_id = @orderId AND order_item_id = @itemId
            `;
            const itemResult = await query(itemQuery, [
                { name: 'orderId', type: sql.Int, value: orderId },
                { name: 'itemId', type: sql.Int, value: itemId }
            ]);

            if (itemResult.length === 0) {
                return { status: 404, body: "Order item not found" };
            }

            const item = itemResult[0];

            // 2. Handle Action
            const pool = await require('../lib/db').getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);

                if (action === 'refund') {
                    if (item.refunded_at) {
                        await transaction.rollback();
                        return { status: 400, body: "Item is already refunded" };
                    }

                    // A. Mark as refunded
                    await request.input('itemId', sql.Int, itemId)
                        .query(`UPDATE order_items SET refunded_at = GETDATE() WHERE order_item_id = @itemId`);

                    // B. Restore Stock if Merchandise
                    if (item.item_type === 'Merchandise' && item.item_reference_id) {
                        await request.input('skuId', sql.Int, item.item_reference_id)
                            .input('qty', sql.Int, item.quantity || 1)
                            .query(`UPDATE product_skus SET current_stock = current_stock + @qty WHERE product_sku_id = @skuId`);
                    }
                }
                else if (action === 'unrefund') {
                    if (!item.refunded_at) {
                        await transaction.rollback();
                        return { status: 400, body: "Item is not refunded" };
                    }

                    // A. Remove refunded status
                    await request.input('itemIdUn', sql.Int, itemId)
                        .query(`UPDATE order_items SET refunded_at = NULL WHERE order_item_id = @itemIdUn`);

                    // B. Reduce Stock if Merchandise
                    if (item.item_type === 'Merchandise' && item.item_reference_id) {
                        await request.input('skuIdUn', sql.Int, item.item_reference_id)
                            .input('qtyUn', sql.Int, item.quantity || 1)
                            .query(`UPDATE product_skus SET current_stock = current_stock - @qtyUn WHERE product_sku_id = @skuIdUn`);
                    }
                } else {
                    await transaction.rollback();
                    return { status: 400, body: "Invalid action" };
                }

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({
                        message: action === 'refund' ? "Item refunded successfully" : "Item un-refunded successfully",
                        stockUpdated: item.item_type === 'Merchandise'
                    })
                };

            } catch (txError) {
                await transaction.rollback();
                throw txError;
            }

        } catch (error) {
            context.log(`Error in refundOrderItem: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
