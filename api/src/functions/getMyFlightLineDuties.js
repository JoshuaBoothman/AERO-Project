const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getMyFlightLineDuties', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{slug}/my-flight-line-duties',
    handler: async (request, context) => {
        try {
            const { slug } = request.params;
            const user = validateToken(request);
            if (!user) {
                return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Get event ID from slug
            const eventQ = `SELECT event_id FROM events WHERE slug = @slug`;
            const eventResult = await query(eventQ, [{ name: 'slug', type: sql.NVarChar, value: slug }]);

            if (eventResult.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
            }

            const eventId = eventResult[0].event_id;

            // Get all pilots (attendees) for this user at this event
            const pilotsQ = `
                SELECT 
                    a.attendee_id,
                    p.first_name,
                    p.last_name,
                    a.flight_line_duties
                FROM attendees a
                JOIN persons p ON a.person_id = p.person_id
                WHERE a.event_id = @eventId 
                  AND p.user_id = @userId
                  AND a.status = 'Registered'
                ORDER BY p.first_name, p.last_name
            `;
            const pilots = await query(pilotsQ, [
                { name: 'eventId', type: sql.Int, value: eventId },
                { name: 'userId', type: sql.Int, value: user.userId }
            ]);

            // Get flight line duties for all user's pilots
            const dutiesQ = `
                SELECT 
                    flr.roster_id,
                    flr.roster_date,
                    flr.start_time,
                    flr.end_time,
                    flr.attendee_id,
                    fl.flight_line_name,
                    fl.flight_line_id
                FROM flight_line_roster flr
                JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                JOIN attendees a ON flr.attendee_id = a.attendee_id
                JOIN persons p ON a.person_id = p.person_id
                WHERE fl.event_id = @eventId 
                  AND p.user_id = @userId
                ORDER BY flr.roster_date, flr.start_time
            `;
            const duties = await query(dutiesQ, [
                { name: 'eventId', type: sql.Int, value: eventId },
                { name: 'userId', type: sql.Int, value: user.userId }
            ]);

            return {
                jsonBody: {
                    pilots: pilots,
                    duties: duties
                }
            };
        } catch (error) {
            context.error(`Error getting flight line duties: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
