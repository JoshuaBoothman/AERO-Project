const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getUserEventAttendees', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{slug}/my-attendees',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const { slug } = request.params;

        try {
            const pool = await getPool();

            // 1. Get Event ID from Slug
            const eventRes = await pool.request()
                .input('slug', sql.NVarChar, slug)
                .query("SELECT event_id FROM events WHERE slug = @slug");

            if (eventRes.recordset.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
            }
            const eventId = eventRes.recordset[0].event_id;

            // 2. Fetch Attendees for this User & Event where is_pilot = 1
            // We verify ownership via persons.user_id
            const query = `
                SELECT 
                    a.attendee_id,
                    p.person_id,
                    a.ticket_code,
                    p.first_name,
                    p.last_name,
                    t.name as ticket_name
                FROM attendees a
                JOIN persons p ON a.person_id = p.person_id
                JOIN event_ticket_types t ON a.ticket_type_id = t.ticket_type_id
                WHERE a.event_id = @eventId
                  AND p.user_id = @userId
                  AND t.system_role = 'pilot'
                  AND a.status = 'Registered'
            `;

            const result = await pool.request()
                .input('eventId', sql.Int, eventId)
                .input('userId', sql.Int, user.userId)
                .query(query);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };

        } catch (error) {
            context.log(`Error fetching user attendees: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
