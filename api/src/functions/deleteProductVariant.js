const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteProductVariant', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'variants/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const variantId = request.params.id;

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Guard: Check for existing options
                const checkOpts = await transaction.request()
                    .input('vid', sql.Int, variantId)
                    .query("SELECT TOP 1 variant_option_id FROM variant_options WHERE variant_id = @vid");

                if (checkOpts.recordset.length > 0) {
                    await transaction.rollback();
                    return { status: 409, body: JSON.stringify({ error: "Cannot delete category while options exist. Please delete all options (e.g. Small, Large) first." }) };
                }

                // 2. Get Category ID for potential cleanup
                const getCat = await transaction.request()
                    .input('vid', sql.Int, variantId)
                    .query("SELECT variant_category_id FROM variants WHERE variant_id = @vid");

                if (getCat.recordset.length === 0) {
                    await transaction.rollback();
                    return { status: 404, body: JSON.stringify({ error: "Variant not found" }) };
                }
                const catId = getCat.recordset[0].variant_category_id;

                // 3. Delete the Variant Link
                await transaction.request()
                    .input('vid', sql.Int, variantId)
                    .query("DELETE FROM variants WHERE variant_id = @vid");

                // 4. Verify Global Usage of Category
                const checkUsage = await transaction.request()
                    .input('cid', sql.Int, catId)
                    .query("SELECT TOP 1 variant_id FROM variants WHERE variant_category_id = @cid");

                let categoryCleaned = false;
                if (checkUsage.recordset.length === 0) {
                    // Orphaned -> Delete it
                    await transaction.request()
                        .input('cid', sql.Int, catId)
                        .query("DELETE FROM variant_categories WHERE variant_category_id = @cid");
                    categoryCleaned = true;
                }

                await transaction.commit();
                return { status: 200, jsonBody: { message: "Variant category removed", categoryCleaned } };

            } catch (err) {
                await transaction.rollback();
                console.error("Transaction Error", err);
                throw err;
            }

        } catch (error) {
            context.error('Error deleting variant:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error", details: error.message }) };
        }
    }
});
