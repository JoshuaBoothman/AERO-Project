const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('manageVariantCategory', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'variant-categories/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const categoryId = request.params.id;
        const body = await request.json();
        let { name, merge } = body;
        if (merge === 'true') merge = true;



        if (!name) {
            return { status: 400, body: JSON.stringify({ error: "Name is required" }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Check if name exists (excluding current category)
                const checkRes = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('id', sql.Int, categoryId)
                    .query("SELECT variant_category_id FROM variant_categories WHERE name = @name AND variant_category_id != @id");

                if (checkRes.recordset.length > 0) {
                    const targetId = checkRes.recordset[0].variant_category_id;

                    if (!merge) {
                        // Conflict found, return 409
                        await transaction.rollback();
                        return {
                            status: 409,
                            jsonBody: {
                                error: "Category name already exists",
                                target_id: targetId,
                                received_merge: merge,
                                received_body: body
                            }
                        };
                    } else {
                        // Merge Logic


                        // Move variants
                        const updateRes = await transaction.request()
                            .input('targetId', sql.Int, targetId)
                            .input('currentId', sql.Int, categoryId)
                            .query("UPDATE variants SET variant_category_id = @targetId WHERE variant_category_id = @currentId");


                        // --- Deduplicate Variants (Post-Merge Cleanup) ---
                        // Ensure no product has two duplicate variant groups for the same category
                        const dups = await transaction.request()
                            .input('tid', sql.Int, targetId)
                            .query(`
                                SELECT product_id 
                                FROM variants 
                                WHERE variant_category_id = @tid 
                                GROUP BY product_id 
                                HAVING COUNT(*) > 1
                            `);

                        if (dups.recordset.length > 0) {

                            for (const row of dups.recordset) {
                                // Get all variants for this product & category
                                const vars = await transaction.request()
                                    .input('pid', sql.Int, row.product_id)
                                    .input('tid', sql.Int, targetId)
                                    .query("SELECT variant_id FROM variants WHERE product_id = @pid AND variant_category_id = @tid ORDER BY variant_id ASC");

                                const [target, ...sources] = vars.recordset;

                                for (const source of sources) {
                                    // Move options to target
                                    await transaction.request()
                                        .input('targetVarId', sql.Int, target.variant_id)
                                        .input('sourceVarId', sql.Int, source.variant_id)
                                        .query("UPDATE variant_options SET variant_id = @targetVarId WHERE variant_id = @sourceVarId");

                                    // Delete duplicate variant source
                                    await transaction.request()
                                        .input('delId', sql.Int, source.variant_id)
                                        .query("DELETE FROM variants WHERE variant_id = @delId");
                                }
                            }
                        }

                        // Delete old category
                        const deleteRes = await transaction.request()
                            .input('id', sql.Int, categoryId)
                            .query("DELETE FROM variant_categories WHERE variant_category_id = @id");


                        await transaction.commit();
                        return { status: 200, jsonBody: { message: "Category merged successfully", stats: { moved: updateRes.rowsAffected[0], deleted: deleteRes.rowsAffected[0] } } };
                    }
                }

                // No conflict, just rename
                await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('id', sql.Int, categoryId)
                    .query("UPDATE variant_categories SET name = @name WHERE variant_category_id = @id");

                await transaction.commit();
                return { status: 200, jsonBody: { message: "Category renamed successfully" } };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.error('Error managing variant category:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
