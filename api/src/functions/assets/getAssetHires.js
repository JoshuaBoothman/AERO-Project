const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('getAssetHires', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'assets/hires',
    handler: async (request, context) => {
        const pool = await getPool();

        try {
            if (request.method === 'POST') {
                // SEEDING / CREATING TEST HERE
                // Body: { asset_item_id, order_item_id, start_date, end_date }
                const body = await request.json();
                const { asset_item_id, order_item_id, start_date, end_date } = body;

                // Simple insert
                await pool.request()
                    .input('itemId', sql.Int, asset_item_id)
                    .input('orderItemId', sql.Int, order_item_id) // We might need to find a valid order_item_id
                    .input('start', sql.DateTime2, start_date)
                    .input('end', sql.DateTime2, end_date)
                    .query(`
                        INSERT INTO asset_hires (asset_item_id, order_item_id, hire_start_date, hire_end_date)
                        VALUES (@itemId, @orderItemId, @start, @end)
                    `);

                return { status: 201, jsonBody: { message: "Hire created" } };
            }

            // GET
            const query = `
                SELECT 
                    ah.asset_hire_id,
                    ah.hire_start_date,
                    ah.hire_end_date,
                    ah.returned_at,
                    ah.condition_on_return,
                    
                    ai.identifier,
                    ai.serial_number,
                    
                    at.name as asset_type_name,
                    at.image_url,
                    
                    o.order_id,
                    p.first_name + ' ' + p.last_name as hirer_name
                    
                FROM asset_hires ah
                JOIN asset_items ai ON ah.asset_item_id = ai.asset_item_id
                JOIN asset_types at ON ai.asset_type_id = at.asset_type_id
                JOIN order_items oi ON ah.order_item_id = oi.order_item_id
                JOIN orders o ON oi.order_id = o.order_id
                LEFT JOIN users u ON o.user_id = u.user_id
                LEFT JOIN persons p ON p.user_id = u.user_id
                
                ORDER BY ah.hire_start_date DESC
            `;

            const result = await pool.request().query(query);

            return {
                status: 200,
                jsonBody: result.recordset
            };

        } catch (error) {
            context.error('Error in getAssetHires:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
