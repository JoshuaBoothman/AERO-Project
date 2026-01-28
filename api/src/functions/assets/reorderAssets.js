const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('reorderAssets', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'assets/{type}/reorder', // type: 'categories' or 'types'
    handler: async (request, context) => {
        const type = request.params.type;
        const body = await request.json(); // Expected: [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]
        const pool = await getPool();

        if (!Array.isArray(body)) {
            return { status: 400, body: JSON.stringify({ error: "Input must be an array of objects { id, sort_order }" }) };
        }

        try {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);

                let tableName = '';
                let idColumn = '';

                if (type === 'categories') {
                    tableName = 'asset_categories';
                    idColumn = 'asset_category_id';
                } else if (type === 'types') {
                    tableName = 'asset_types';
                    idColumn = 'asset_type_id';
                } else {
                    throw new Error("Invalid type. Must be 'categories' or 'types'");
                }

                context.log(`Reordering ${type} with ${body.length} items.`);

                for (const item of body) {
                    const req = new sql.Request(transaction);
                    await req.query(`UPDATE ${tableName} SET sort_order = ${parseInt(item.sort_order)} WHERE ${idColumn} = ${parseInt(item.id)}`);
                }

                await transaction.commit();
                return { status: 200, jsonBody: { message: "Reordered successfully" } };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.error('Error in reorderAssets:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error: " + error.message }) };
        }
    }
});
