const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');

app.http('getPublicRegistrations', {
    methods: ['GET'],
    authLevel: 'anonymous', // We'll handle auth manually or via EasyAuth headers
    route: 'events/{slug}/public-registrations',
    handler: async (request, context) => {
        try {
            const { slug } = request.params;
            context.log(`getPublicRegistrations URL: ${request.url}`);
            context.log(`getPublicRegistrations params: ${JSON.stringify(request.params)}`);

            // Optional: Add Admin Auth Check here using headers
            // const token = request.headers.get('Authorization');
            // if (!verifyAdmin(token)) return { status: 403, jsonBody: { error: 'Unauthorized' } };

            if (!slug) {
                return { status: 400, jsonBody: { error: 'Missing event slug' } };
            }

            const result = await query(`
                SELECT 
                    pr.id, 
                    pr.ticket_code, 
                    pr.first_name, 
                    pr.last_name, 
                    pr.email, 
                    pr.adults_count, 
                    pr.children_count, 
                    pr.created_at,
                    pd.title as day_title, 
                    pd.date as day_date
                FROM public_registrations pr
                JOIN public_event_days pd ON pr.public_event_day_id = pd.id
                JOIN events e ON pd.event_id = e.event_id
                WHERE e.slug = @slug
                ORDER BY pr.created_at DESC
            `, [{ name: 'slug', type: sql.NVarChar, value: slug }]);

            context.log(`Found ${result.length} registrations.`);

            return {
                status: 200,
                jsonBody: result
            };

        } catch (error) {
            context.error(`Error in getPublicRegistrations: ${error.message}`);
            return { status: 500, jsonBody: { error: 'Internal Server Error' } };
        }
    }
});
