const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('reorderProducts', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'manage/products/reorder',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        // 2. Permission Check
        if (user.role !== 'admin') {
            return { status: 403, body: JSON.stringify({ error: "Forbidden" }) };
        }

        try {
            const body = await request.json();
            console.log("Reorder Body:", JSON.stringify(body));
            const { items } = body;

            if (!items || !Array.isArray(items)) {
                console.error("Invalid items array");
                return { status: 400, body: JSON.stringify({ error: "Invalid body. Expected 'items' array." }) };
            }

            // 3. Perform Updates (Sequential)
            // We remove Transaction to avoid potential nesting/locking issues in Serverless for now.
            const pool = await getPool();
            for (const item of items) {
                await pool.request()
                    .input('id', sql.Int, item.id)
                    .input('so', sql.Int, item.sort_order)
                    .query("UPDATE products SET sort_order = @so WHERE product_id = @id");
            }

            console.log("Reorder completed successfully");
            return { status: 200, body: JSON.stringify({ message: "Products reordered successfully" }) };

        } catch (err) {
            context.log(err);
            console.error("General Error:", err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});
