const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');

app.http('getEventTicketTypes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const slug = request.query.get('slug');

        if (!slug) {
            return { status: 400, body: "Missing event slug" };
        }

        try {
            // 1. Get Event ID from Slug
            const eventResult = await query("SELECT event_id FROM events WHERE slug = @slug", [
                { name: 'slug', type: sql.NVarChar, value: slug }
            ]);

            if (eventResult.length === 0) {
                return { status: 404, body: "Event not found" };
            }

            const eventId = eventResult[0].event_id;

            // 2. Fetch Ticket Types
            // We only want 'Spectator' or 'Pilot' roles generally, but for now fetch all visible ones.
            const tickets = await query(`
                SELECT ticket_type_id, name, price, system_role 
                FROM event_ticket_types 
                WHERE event_id = @eventId 
                ORDER BY price ASC
            `, [
                { name: 'eventId', type: sql.Int, value: eventId }
            ]);

            return {
                status: 200,
                body: JSON.stringify(tickets)
            };

        } catch (error) {
            context.log(`Error in getEventTicketTypes: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});