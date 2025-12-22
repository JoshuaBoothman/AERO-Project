const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('getEventDetail', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{slug}', // This allows URLs like /api/events/my-event-slug
    handler: async (request, context) => {
        const { slug } = request.params;

        try {
            // Fetch event + venue details for this specific slug
            const query = `
                SELECT TOP 1
                    e.event_id, 
                    e.name, 
                    e.slug,
                    e.description, 
                    e.start_date, 
                    e.end_date, 
                    e.status,
                    e.is_purchasing_enabled,
                    v.name as venue_name,
                    v.address_line_1,
                    v.city,
                    v.state,
                    v.postcode,
                    v.map_url
                FROM events e
                JOIN venues v ON e.venue_id = v.venue_id
                WHERE e.slug = @slug AND e.is_public_viewable = 1
            `;
            
            // We need to pass the parameter safely. 
            // Note: Our simple db.js might not support parameterized queries yet.
            // For now, we will inject the string carefully (since slugs are url-safe).
            // *Ideally, we update db.js later to use input parameters.*
            
            const safeSlug = slug.replace(/'/g, "''"); // Basic SQL injection protection
            const safeQuery = query.replace('@slug', `'${safeSlug}'`);

            const result = await db.query(safeQuery);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
            }

            return {
                status: 200,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error fetching event: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});