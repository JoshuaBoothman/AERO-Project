const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('manageProductOptions', {
    methods: ['POST', 'DELETE'],
    authLevel: 'anonymous',
    route: 'products/{id}/options',
    handler: async (request, context) => {
        // Auth check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const productId = request.params.id;
        const method = request.method;

        try {
            const pool = await getPool();

            if (method === 'POST') {
                // Add Option Category (e.g. "Color") or Value (e.g. "Red")
                // Format: { categoryName: "Color", value: "Red" }
                // If categoryName doesn't exist on product, create variant linkage.
                // If value is provided, add to variant_options.

                const { categoryName, value } = await request.json();

                if (!categoryName) return { status: 400, body: JSON.stringify({ error: "Category Name required" }) };

                const transaction = new sql.Transaction(pool);
                await transaction.begin();

                try {
                    // 1. Ensure Category Exists Globally
                    let catResult = await transaction.request()
                        .input('name', sql.NVarChar, categoryName)
                        .query("SELECT variant_category_id FROM variant_categories WHERE name = @name");

                    let catId;
                    if (catResult.recordset.length === 0) {
                        const createCat = await transaction.request()
                            .input('name', sql.NVarChar, categoryName)
                            .query("INSERT INTO variant_categories (name) OUTPUT inserted.variant_category_id VALUES (@name)");
                        catId = createCat.recordset[0].variant_category_id;
                    } else {
                        catId = catResult.recordset[0].variant_category_id;
                    }

                    // 2. Ensure Product has this Variant Category
                    let varResult = await transaction.request()
                        .input('pid', sql.Int, productId)
                        .input('cid', sql.Int, catId)
                        .query("SELECT variant_id FROM variants WHERE product_id = @pid AND variant_category_id = @cid");

                    let variantId;
                    if (varResult.recordset.length === 0) {
                        const createVar = await transaction.request()
                            .input('pid', sql.Int, productId)
                            .input('cid', sql.Int, catId)
                            .query("INSERT INTO variants (product_id, variant_category_id) OUTPUT inserted.variant_id VALUES (@pid, @cid)");
                        variantId = createVar.recordset[0].variant_id;
                    } else {
                        variantId = varResult.recordset[0].variant_id;
                    }

                    // 3. Add Option Value if provided
                    let newOptionId = null;
                    if (value) {
                        // Check for duplicate
                        const checkOpt = await transaction.request()
                            .input('vid', sql.Int, variantId)
                            .input('val', sql.NVarChar, value)
                            .query("SELECT variant_option_id FROM variant_options WHERE variant_id = @vid AND value = @val");

                        if (checkOpt.recordset.length === 0) {
                            const insertOpt = await transaction.request()
                                .input('vid', sql.Int, variantId)
                                .input('val', sql.NVarChar, value)
                                .query("INSERT INTO variant_options (variant_id, value) OUTPUT INSERTED.variant_option_id VALUES (@vid, @val)");
                            newOptionId = insertOpt.recordset[0].variant_option_id;
                        } else {
                            newOptionId = checkOpt.recordset[0].variant_option_id;
                        }
                    }

                    await transaction.commit();
                    return {
                        status: 200,
                        jsonBody: {
                            message: "Option updated/added",
                            option: {
                                id: newOptionId,
                                value: value,
                                variant_id: variantId,
                                category_name: categoryName
                            }
                        }
                    };

                } catch (err) {
                    await transaction.rollback();
                    throw err;
                }
            }

            if (method === 'DELETE') {
                // Remove entire Variant Category from product OR specific value
                // For now, let's just handle removing the Category from the product (which cascades?)
                // Or maybe removing a specific value.
                // Todo: Implementation based on specific ID requirements.
                return { status: 501, body: "Not implemented yet" };
            }

        } catch (error) {
            context.log.error('Error managing options:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
