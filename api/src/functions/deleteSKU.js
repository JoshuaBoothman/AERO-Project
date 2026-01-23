const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteSKU', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'skus/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        const skuId = request.params.id;

        try {
            const pool = await getPool();

            // Delete SKU - Cascading delete of option links first?
            // Schema has FKs? Let's assume we need to clean up links first.

            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Delete from event_skus (Availability links)
                await transaction.request()
                    .input('id', sql.Int, skuId)
                    .query("DELETE FROM event_skus WHERE product_sku_id = @id");

                // 2. Delete links
                await transaction.request()
                    .input('id', sql.Int, skuId)
                    .query("DELETE FROM sku_option_links WHERE product_sku_id = @id");

                // 3. Delete SKU
                await transaction.request()
                    .input('id', sql.Int, skuId)
                    .query("DELETE FROM product_skus WHERE product_sku_id = @id");

                await transaction.commit();
                return { status: 200, jsonBody: { message: "SKU deleted" } };

            } catch (err) {
                await transaction.rollback();
                // Check for specific constraint errors
                if (err.number === 547) {
                    return { status: 409, jsonBody: { error: "Cannot delete SKU because it has been purchased or used in orders. Deactivate it instead." } };
                }
                throw err;
            }

        } catch (error) {
            context.error('Error deleting SKU:', error);
            // Also try to log the original error message to response for debugging if it's admin
            return { status: 500, jsonBody: { error: "Internal Server Error", details: error.message } };
        }
    }
});
