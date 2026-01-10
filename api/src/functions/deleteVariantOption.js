const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteVariantOption', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'options/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const optionId = request.params.id;

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Identify SKUs that use this option
                // We need to delete ANY SKU that has this option linked.
                // It doesn't matter if it has other options linked too; if it relied on "Red" and we delete "Red", the SKU "Small Red" is invalid.

                // First, find the SKUs to delete
                const affectedSkusResult = await transaction.request()
                    .input('optId', sql.Int, optionId)
                    .query("SELECT product_sku_id FROM sku_option_links WHERE variant_option_id = @optId");

                const skuIds = affectedSkusResult.recordset.map(r => r.product_sku_id);

                if (skuIds.length > 0) {
                    // Create a comma-separated list for IN clause (safely, though they are ints)
                    // Unfortunately SQL injection safe way with variable list is tricky in simple query text without table valued parameters.
                    // But since these come from our own select above and are integers, we can build the string.
                    const skuList = skuIds.join(',');

                    // 2. Delete from event_skus (the sales/pricing links)
                    await transaction.request()
                        .query(`DELETE FROM event_skus WHERE product_sku_id IN (${skuList})`);

                    // 3. Delete from sku_option_links (ALL links for these SKUs, not just the one query)
                    // We want to fully wipe the SKU, so we remove all its option configurations.
                    await transaction.request()
                        .query(`DELETE FROM sku_option_links WHERE product_sku_id IN (${skuList})`);

                    // 4. Delete the SKUs themselves
                    await transaction.request()
                        .query(`DELETE FROM product_skus WHERE product_sku_id IN (${skuList})`);
                }

                // 5. Finally, delete the variant option itself
                // (Constraint: if mistakenly valid SKUs still existed, FK would fail, but we deleted them above)
                await transaction.request()
                    .input('optId', sql.Int, optionId)
                    .query("DELETE FROM variant_options WHERE variant_option_id = @optId");

                await transaction.commit();
                return { status: 200, jsonBody: { message: "Option and associated SKUs deleted", deletedSkuCount: skuIds.length, deletedSkuIds: skuIds } };

            } catch (err) {
                await transaction.rollback();
                console.error("Transaction Error", err);
                // Check for specific constraint errors
                if (err.number === 547) {
                    return { status: 409, body: JSON.stringify({ error: "Cannot delete option because it is in use by orders or other restricted data." }) };
                }
                throw err;
            }

        } catch (error) {
            context.error('Error deleting option:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error", details: error.message }) };
        }
    }
});
