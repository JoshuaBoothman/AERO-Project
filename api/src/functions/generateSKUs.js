const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('generateSKUs', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'products/{id}/generate-skus',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const productId = request.params.id;

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Fetch all variants and their options for this product
                const variantsResult = await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query(`
                        SELECT v.variant_id, vc.name as category_name 
                        FROM variants v
                        JOIN variant_categories vc ON v.variant_category_id = vc.variant_category_id
                        WHERE v.product_id = @pid
                    `);

                const variants = variantsResult.recordset;
                if (variants.length === 0) {
                    // No variants = 1 SKU (Simple Product) ? 
                    // Or do nothing? Let's assume user wants to reset SKUs based on current options.
                    // If no variants, maybe just 1 default SKU?
                    await transaction.commit();
                    return { status: 200, jsonBody: { message: "No variants found, no complex SKUs generated." } };
                }

                const optionsMap = {};
                for (const v of variants) {
                    const opts = await transaction.request()
                        .input('vid', sql.Int, v.variant_id)
                        .query("SELECT variant_option_id, value FROM variant_options WHERE variant_id = @vid");
                    optionsMap[v.variant_id] = opts.recordset;
                }

                // 2. Calculate Cartesian Product
                // variants: [{id: 1}, {id: 2}]
                // options: { 1: [A, B], 2: [X, Y] }
                // result: AX, AY, BX, BY

                const variantIds = variants.map(v => v.variant_id);

                // Helper to generate combinations
                const generateCombinations = (index, currentCombo) => {
                    if (index === variantIds.length) {
                        return [currentCombo];
                    }
                    const vid = variantIds[index];
                    const opts = optionsMap[vid];
                    if (!opts || opts.length === 0) return generateCombinations(index + 1, currentCombo); // Skip empty variants

                    let combos = [];
                    for (const opt of opts) {
                        combos = combos.concat(generateCombinations(index + 1, [...currentCombo, opt]));
                    }
                    return combos;
                };

                const combinations = generateCombinations(0, []);

                // 3. For each combination, check if SKU exists, if not create it
                let createdCount = 0;

                for (const combo of combinations) {
                    // combo is array of { variant_option_id, value }

                    // Ideally we check if a SKU with EXACTLY these links exists.
                    // Complex SQL query or just create them and assume if dupes exist we ignore?
                    // Better: Create a SKU code based on IDs and check?
                    // Or: Check for SKU that has ALL these option_links.

                    // For now, simplified approach:
                    // Just insert a new SKU if we can't find one linked to these EXACT options.
                    // This is computationally expensive in SQL loop. 
                    // Optimization: We assume "Regenerate" might verify existing.

                    // Let's just blindly create for now and user can delete/manage duplicates? 
                    // No, that's messy.

                    // "Find SKU ID where count(links) = N and links IN (list)"
                    const optionIds = combo.map(c => c.variant_option_id);
                    // This query is tricky inside a loop.

                    // Alternative: Create a unique string hash of sorted Option IDs?
                    // Let's verify existing logic in schema... there isn't one.

                    // Let's create a SKU code: "PROD-{ID}-{OPT1}-{OPT2}"
                    const skuCode = `P${productId}-` + optionIds.sort().join('-');

                    // Check if sku_code exists (sku_code is unique in schema)
                    const checkSku = await transaction.request()
                        .input('code', sql.NVarChar, skuCode)
                        .query("SELECT product_sku_id FROM product_skus WHERE sku_code = @code");

                    if (checkSku.recordset.length === 0) {
                        // Create SKU
                        const skuRes = await transaction.request()
                            .input('pid', sql.Int, productId)
                            .input('code', sql.NVarChar, skuCode)
                            .query(`
                                INSERT INTO product_skus (product_id, sku_code, current_stock, is_active, price)
                                OUTPUT inserted.product_sku_id
                                VALUES (@pid, @code, 0, 1, 0)
                            `);
                        const newSkuId = skuRes.recordset[0].product_sku_id;

                        // Link Options
                        for (const opt of combo) {
                            await transaction.request()
                                .input('sid', sql.Int, newSkuId)
                                .input('oid', sql.Int, opt.variant_option_id)
                                .query("INSERT INTO sku_option_links (product_sku_id, variant_option_id) VALUES (@sid, @oid)");
                        }
                        createdCount++;
                    }
                }

                await transaction.commit();
                return { status: 200, jsonBody: { message: `Generated ${createdCount} new SKUs`, combinations: combinations.length } };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log.error('Error generating SKUs:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
