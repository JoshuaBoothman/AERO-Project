const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteProduct', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'products/{id}',
    handler: async (request, context) => {
        // Auth check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const productId = request.params.id;
        const force = request.query.get('force') === 'true';

        try {
            const pool = await getPool();

            // 1. Check for Orders
            // We need to check if any order_items reference this product via product_skus
            const checkOrders = await pool.request()
                .input('pid', sql.Int, productId)
                .query(`
                    SELECT TOP 1 oi.id
                    FROM order_items oi
                    JOIN product_skus s ON oi.item_reference_id = s.product_sku_id
                    WHERE s.product_id = @pid AND oi.item_type = 'Merchandise'
                `);

            if (checkOrders.recordset.length > 0) {
                return {
                    status: 409,
                    jsonBody: {
                        error: "Cannot delete product with existing orders.",
                        code: "HAS_ORDERS"
                    }
                };
            }

            // 2. Check for SKUs (if not forced)
            if (!force) {
                const checkSkus = await pool.request()
                    .input('pid', sql.Int, productId)
                    .query("SELECT COUNT(*) as count FROM product_skus WHERE product_id = @pid");

                const skuCount = checkSkus.recordset[0].count;
                if (skuCount > 0) {
                    return {
                        status: 409,
                        jsonBody: {
                            error: `This product has ${skuCount} SKUs. Deleting it will permanently remove all inventory records.`,
                            code: "HAS_SKUS",
                            skuCount
                        }
                    };
                }
            }

            // 3. Perform Deletion
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Delete SKU Option Links (via subquery on product_skus)
                await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query(`
                        DELETE FROM sku_option_links 
                        WHERE product_sku_id IN (SELECT product_sku_id FROM product_skus WHERE product_id = @pid)
                    `);

                // Delete SKUs
                await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query("DELETE FROM product_skus WHERE product_id = @pid");

                // Delete Variant Options (via subquery on variants)
                await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query(`
                        DELETE FROM variant_options 
                        WHERE variant_id IN (SELECT variant_id FROM variants WHERE product_id = @pid)
                    `);

                // Delete Variants
                await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query("DELETE FROM variants WHERE product_id = @pid");

                // Delete Product
                await transaction.request()
                    .input('pid', sql.Int, productId)
                    .query("DELETE FROM products WHERE product_id = @pid");

                await transaction.commit();
                return { status: 200, jsonBody: { message: "Product deleted successfully" } };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log.error('Error deleting product:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error", details: error.message }) };
        }
    }
});
