const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateSKU', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'skus/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const skuId = request.params.id;
        const body = await request.json();

        // Destructure possible fields
        const { price, current_stock, image_url, barcode, is_active } = body;

        try {
            const pool = await getPool();

            // Construct dynamic update query
            const updates = [];
            const req = pool.request().input('id', sql.Int, skuId);

            if (price !== undefined) {
                updates.push("price = @price");
                req.input('price', sql.Decimal(10, 2), price);
            }
            if (current_stock !== undefined) {
                updates.push("current_stock = @stock");
                req.input('stock', sql.Int, current_stock);
            }
            if (image_url !== undefined) {
                updates.push("image_url = @img");
                req.input('img', sql.NVarChar, image_url);
            }
            if (barcode !== undefined) {
                updates.push("barcode = @code");
                req.input('code', sql.NVarChar, barcode);
            }
            if (is_active !== undefined) {
                updates.push("is_active = @active");
                req.input('active', sql.Bit, is_active);
            }

            if (updates.length > 0) {
                const query = `UPDATE product_skus SET ${updates.join(', ')} WHERE product_sku_id = @id`;
                await req.query(query);
            }

            return { status: 200, jsonBody: { message: "SKU updated" } };

        } catch (error) {
            context.log.error('Error updating SKU:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
