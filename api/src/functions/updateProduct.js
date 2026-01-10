const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateProduct', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'products/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const productId = request.params.id;
        const { name, description, base_image_url, is_active } = await request.json();

        try {
            const pool = await getPool();
            const updates = [];
            const req = pool.request().input('id', sql.Int, productId);

            if (name !== undefined) {
                updates.push("name = @name");
                req.input('name', sql.NVarChar, name);
            }
            if (description !== undefined) {
                updates.push("description = @desc");
                req.input('desc', sql.NVarChar, description);
            }
            if (base_image_url !== undefined) {
                updates.push("base_image_url = @img");
                req.input('img', sql.NVarChar, base_image_url);
            }
            if (is_active !== undefined) {
                updates.push("is_active = @active");
                req.input('active', sql.Bit, is_active);
            }

            if (updates.length > 0) {
                await req.query(`UPDATE products SET ${updates.join(', ')} WHERE product_id = @id`);
            }

            return { status: 200, jsonBody: { message: "Product updated successfully" } };

        } catch (error) {
            context.log.error('Error updating product:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
