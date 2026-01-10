const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('getAssets', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'assets',
    handler: async (request, context) => {
        try {
            const pool = await getPool();
            const eventId = request.query.get('eventId'); // Optional filter

            let query = `
                SELECT 
                    at.asset_type_id,
                    at.name,
                    at.description,
                    at.base_hire_cost,
                    at.image_url,
                    (SELECT COUNT(*) FROM asset_items ai WHERE ai.asset_type_id = at.asset_type_id) as total_items,
                    (SELECT COUNT(*) FROM asset_items ai WHERE ai.asset_type_id = at.asset_type_id AND ai.status = 'Active') as active_items
                FROM asset_types at
            `;

            if (eventId) {
                query += ` WHERE at.event_id = @eventId`;
            }

            query += ` ORDER BY at.name ASC`;

            const requestObj = pool.request();
            if (eventId) requestObj.input('eventId', sql.Int, eventId);

            const result = await requestObj.query(query);

            return {
                status: 200,
                jsonBody: result.recordset
            };

        } catch (error) {
            context.error('Error fetching assets:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
