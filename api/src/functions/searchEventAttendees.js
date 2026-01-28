const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('searchEventAttendees', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{slug}/attendees/search',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const { slug } = request.params;
        const query = request.query.get('q');

        if (!query || query.length < 2) {
            return { status: 400, body: JSON.stringify({ error: "Search query must be at least 2 characters." }) };
        }

        try {
            const pool = await getPool();

            // 2. Get Event ID and Check Access? 
            // Any logged in user can search attendees for the event?
            // Plan says: "The new 'Search Attendees' endpoint will allow any logged-in user to search the names of all attendees for the event. This is necessary for the feature but should be noted."

            const eventRes = await pool.request()
                .input('slug', sql.NVarChar, slug)
                .query("SELECT event_id, name FROM events WHERE slug = @slug");

            if (eventRes.recordset.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
            }
            const eventId = eventRes.recordset[0].event_id;

            // 3. Search Attendees
            const searchReq = pool.request();
            searchReq.input('eid', sql.Int, eventId);
            searchReq.input('q', sql.NVarChar, `%${query}%`);

            // Limit to top 20 to prevent scraping
            const searchSql = `
                SELECT TOP 20
                    a.attendee_id,
                    p.first_name,
                    p.last_name,
                    tt.name as ticket_name,
                    a.status
                FROM attendees a
                JOIN persons p ON a.person_id = p.person_id
                JOIN event_ticket_types tt ON a.ticket_type_id = tt.ticket_type_id
                WHERE a.event_id = @eid
                AND a.status IN ('Registered', 'CheckedIn')
                AND (
                    p.first_name LIKE @q OR 
                    p.last_name LIKE @q OR
                    (p.first_name + ' ' + p.last_name) LIKE @q
                )
                ORDER BY p.last_name ASC, p.first_name ASC
            `;

            const result = await searchReq.query(searchSql);

            // Format results
            const attendees = result.recordset.map(row => ({
                attendee_id: row.attendee_id,
                name: `${row.first_name} ${row.last_name}`,
                ticketType: row.ticket_name,
                status: row.status
            }));

            return {
                status: 200,
                body: JSON.stringify({ attendees })
            };

        } catch (err) {
            context.log(`Error searching attendees: ${err.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
