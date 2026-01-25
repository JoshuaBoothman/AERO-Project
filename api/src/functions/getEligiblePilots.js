const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getEligiblePilots', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/eligible-pilots',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT 
                    a.attendee_id,
                    a.arrival_date,
                    a.departure_date,
                    p.first_name,
                    p.last_name,
                    p.person_id
                FROM attendees a
                JOIN persons p ON a.person_id = p.person_id
                WHERE a.event_id = @eventId 
                  AND a.flight_line_duties = 1 
                  AND a.status = 'Registered'
                ORDER BY p.first_name, p.last_name
            `;

            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            return { jsonBody: result };
        } catch (error) {
            context.error(`Error getting eligible pilots: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
