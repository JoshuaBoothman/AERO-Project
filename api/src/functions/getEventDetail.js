const { app } = require('@azure/functions');
const db = require('../lib/db');
const { sql } = require('../lib/db'); // Destructure sql types
const { validateToken } = require('../lib/auth');

app.http('getEventDetail', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{slug}',
    handler: async (request, context) => {
        const { slug } = request.params;

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

            // 1. Fetch Event & Venue (Parameterized)
            let eventQuery;

            if (isAdmin) {
                eventQuery = `
                    SELECT TOP 1
                        e.event_id, e.name, e.slug, e.description, e.banner_url,
                        e.start_date, e.end_date, e.status, e.is_purchasing_enabled, e.venue_id,
                        v.name as venue_name, v.address_line_1, v.city, v.state, v.postcode, v.map_url
                    FROM events e
                    LEFT JOIN venues v ON e.venue_id = v.venue_id
                    WHERE e.slug = @slug
                `;
            } else {
                eventQuery = `
                    SELECT TOP 1
                        e.event_id, e.name, e.slug, e.description, e.banner_url,
                        e.start_date, e.end_date, e.status, e.is_purchasing_enabled, e.venue_id,
                        v.name as venue_name, v.address_line_1, v.city, v.state, v.postcode, v.map_url
                    FROM events e
                    JOIN venues v ON e.venue_id = v.venue_id
                    WHERE e.slug = @slug AND e.is_public_viewable = 1
                `;
            }

            const eventResult = await db.query(eventQuery, [
                { name: 'slug', type: sql.NVarChar, value: slug }
            ]);

            if (eventResult.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
            }

            const eventData = eventResult[0];

            // 2. Fetch Ticket Types for this Event (Parameterized)
            const ticketQuery = `
                SELECT ticket_type_id, name, price, system_role, is_pilot, is_pit_crew
                FROM event_ticket_types 
                WHERE event_id = @eventId
            `;

            const ticketResult = await db.query(ticketQuery, [
                { name: 'eventId', type: sql.Int, value: eventData.event_id }
            ]);

            // 3. Return Combined Data
            return {
                status: 200,
                jsonBody: {
                    ...eventData,
                    tickets: ticketResult
                }
            };

        } catch (error) {
            context.error(`Error fetching event: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});