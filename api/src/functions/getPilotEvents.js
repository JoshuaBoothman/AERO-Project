const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getPilotEvents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user/pilot-events',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const pool = await getPool();

            // Query events where the user has an attendee record with a 'pilot' role ticket
            const query = `
                SELECT DISTINCT 
                    e.event_id,
                    e.name,
                    e.slug,
                    e.start_date
                FROM events e
                JOIN attendees a ON e.event_id = a.event_id
                JOIN persons p ON a.person_id = p.person_id
                JOIN event_ticket_types t ON a.ticket_type_id = t.ticket_type_id
                WHERE p.user_id = @uid
                  AND t.system_role = 'pilot'
                  AND a.status IN ('Registered', 'CheckedIn')
                ORDER BY e.start_date DESC
            `;

            const result = await pool.request()
                .input('uid', sql.Int, user.userId)
                .query(query);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };

        } catch (error) {
            context.log(`Error fetching pilot events: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
