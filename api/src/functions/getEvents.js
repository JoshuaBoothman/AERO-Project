const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('getEvents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const query = `
                SELECT 
                    e.event_id, 
                    e.name, 
                    e.slug,
                    e.description, 
                    e.start_date, 
                    e.end_date, 
                    e.status,
                    v.name as venue_name,
                    v.city,
                    v.state
                FROM events e
                JOIN venues v ON e.venue_id = v.venue_id
                WHERE e.is_public_viewable = 1
                ORDER BY e.start_date DESC
            `;
            
            const events = await db.query(query);

            return {
                status: 200,
                jsonBody: events
            };

        } catch (error) {
            context.error(`Error fetching events: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});