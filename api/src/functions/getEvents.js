const { app } = require('@azure/functions');
const db = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getEvents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Check if loading user is an admin
            let isAdmin = false;
            try {
                const user = validateToken(request);
                if (user && user.role === 'admin') {
                    isAdmin = true;
                }
            } catch (e) {
                // Token might be missing or invalid, treat as public
            }

            let query;

            if (isAdmin) {
                // Admin sees ALL events (Draft, Archived, etc)
                query = `
                    SELECT 
                        e.event_id, 
                        e.name, 
                        e.slug,
                        e.description,
                        e.banner_url,
                        e.start_date, 
                        e.end_date, 
                        e.status,
                        v.name as venue_name,
                        v.city,
                        v.state
                    FROM events e
                    LEFT JOIN venues v ON e.venue_id = v.venue_id
                    ORDER BY e.start_date DESC
                `;
            } else {
                // Public only sees viewable events
                query = `
                    SELECT 
                        e.event_id, 
                        e.name, 
                        e.slug,
                        e.description,
                        e.banner_url,
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
            }

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