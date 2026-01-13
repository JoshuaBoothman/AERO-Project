const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');

app.http('getProducts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products',
    handler: async (request, context) => {
        try {
            const pool = await getPool();

            // Fetch Products with SKU count and total stock
            const result = await pool.request().query(`
                SELECT 
                    p.product_id, 
                    p.name, 
                    p.base_image_url, 
                    p.is_active,
                    (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.product_id) as variant_count,
                    (SELECT COUNT(*) FROM product_skus s WHERE s.product_id = p.product_id AND s.is_active = 1) as sku_count,
                    (SELECT SUM(current_stock) FROM product_skus s WHERE s.product_id = p.product_id AND s.is_active = 1) as total_stock
                FROM products p
                -- WHERE p.is_active = 1 (Removed to allow fetching archived products for admin)

                ORDER BY p.created_at DESC
            `);

            return {
                status: 200,
                jsonBody: result.recordset
            };

        } catch (error) {
            context.log.error('Error fetching products:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
