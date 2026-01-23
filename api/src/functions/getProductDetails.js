const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');

app.http('getProductDetails', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products/{id}',
    handler: async (request, context) => {
        const productId = request.params.id;

        try {
            const pool = await getPool();

            // 1. Basic Info
            const productRes = await pool.request()
                .input('id', sql.Int, productId)
                .query("SELECT * FROM products WHERE product_id = @id");

            if (productRes.recordset.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Product not found" }) };
            }
            const product = productRes.recordset[0];

            // 2. Variants & Options
            const variantsRes = await pool.request()
                .input('pid', sql.Int, productId)
                .query(`
                    SELECT v.variant_id, v.variant_category_id, vc.name as category_name, vo.variant_option_id, vo.value
                    FROM variants v
                    JOIN variant_categories vc ON v.variant_category_id = vc.variant_category_id
                    LEFT JOIN variant_options vo ON v.variant_id = vo.variant_id
                    WHERE v.product_id = @pid
                    ORDER BY v.variant_id, vo.sort_order
                `);

            const variantsMap = new Map();
            variantsRes.recordset.forEach(row => {
                if (!variantsMap.has(row.variant_id)) {
                    variantsMap.set(row.variant_id, {
                        variant_id: row.variant_id,
                        category_id: row.variant_category_id,
                        name: row.category_name,
                        options: []
                    });
                }
                if (row.variant_option_id) {
                    variantsMap.get(row.variant_id).options.push({
                        id: row.variant_option_id,
                        value: row.value
                    });
                }
            });
            const variants = Array.from(variantsMap.values());

            // 3. SKUs
            const skuRes = await pool.request()
                .input('pid', sql.Int, productId)
                .query(`
                    SELECT s.product_sku_id, s.sku_code, s.barcode, s.current_stock, s.price, s.cost_price, s.image_url, s.is_active,
                           vc.name as cat_name, vo.value as opt_value
                    FROM product_skus s
                    LEFT JOIN sku_option_links link ON s.product_sku_id = link.product_sku_id
                    LEFT JOIN variant_options vo ON link.variant_option_id = vo.variant_option_id
                    LEFT JOIN variants v ON vo.variant_id = v.variant_id
                    LEFT JOIN variant_categories vc ON v.variant_category_id = vc.variant_category_id
                    WHERE s.product_id = @pid
                `);

            const skusMap = new Map();
            skuRes.recordset.forEach(row => {
                if (!skusMap.has(row.product_sku_id)) {
                    skusMap.set(row.product_sku_id, {
                        id: row.product_sku_id,
                        code: row.sku_code,
                        price: row.price,
                        cost_price: row.cost_price, // Added cost_price
                        stock: row.current_stock,
                        image_url: row.image_url, // Changed from image to image_url
                        active: row.is_active,
                        options: []
                    });
                }
                if (row.cat_name) {
                    skusMap.get(row.product_sku_id).options.push(`${row.cat_name}: ${row.opt_value}`);
                }
            });

            const skus = Array.from(skusMap.values()).map(s => ({
                ...s,
                description: s.options.join(', ')
            }));

            return {
                status: 200,
                jsonBody: {
                    product,
                    variants,
                    skus
                }
            };

        } catch (error) {
            context.error('Error fetching details:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
