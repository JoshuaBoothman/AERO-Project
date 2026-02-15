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
                    at.full_event_cost,
                    ISNULL(at.show_daily_cost, 1) as show_daily_cost,
                    ISNULL(at.show_full_event_cost, 0) as show_full_event_cost,
                    at.image_url,
                    at.asset_category_id,
                    at.stock_quantity,
                    at.sort_order,
                    at.option_label,
                    (SELECT COUNT(*) FROM asset_type_options ato WHERE ato.asset_type_id = at.asset_type_id AND ato.is_active = 1) as option_count,
                    ac.name as category_name,
                    ISNULL(ac.sort_order, 9999) as category_sort_order,
                    (SELECT COUNT(*) FROM asset_items ai WHERE ai.asset_type_id = at.asset_type_id) as total_items,
                    (SELECT COUNT(*) FROM asset_items ai WHERE ai.asset_type_id = at.asset_type_id AND ai.status = 'Active') as active_items
                FROM asset_types at
                LEFT JOIN asset_categories ac ON at.asset_category_id = ac.asset_category_id
            `;

            if (eventId) {
                query += ` WHERE (at.event_id = @eventId OR at.event_id IS NULL)`;
            }

            query += ` ORDER BY category_sort_order ASC, at.sort_order ASC, at.name ASC`;

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
