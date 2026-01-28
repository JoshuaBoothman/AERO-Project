const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createProduct', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'products',
    handler: async (request, context) => {
        // Auth check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const { name, description, base_image_url, supplier_id } = await request.json();

            if (!name) {
                return { status: 400, body: JSON.stringify({ error: "Name is required" }) };
            }

            const pool = await getPool();

            // Insert Product
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('desc', sql.NVarChar, description || '')
                .input('img', sql.NVarChar, base_image_url || '')
                .input('supplier', sql.Int, supplier_id || null)
                .query(`
                    INSERT INTO products (name, description, base_image_url, is_active, supplier_id)
                    OUTPUT inserted.product_id
                    VALUES (@name, @desc, @img, 1, @supplier)
                `);

            const newProductId = result.recordset[0].product_id;

            return {
                status: 201,
                jsonBody: {
                    message: "Product created successfully",
                    product_id: newProductId
                }
            };

        } catch (error) {
            context.error('Error creating product:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
