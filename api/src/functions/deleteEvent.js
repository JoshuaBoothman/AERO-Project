const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteEvent', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'events/{eventId}',
    handler: async (request, context) => {
        const { eventId } = request.params;

        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Delete Query
            const deleteQuery = `DELETE FROM events WHERE event_id = @eventId`;

            // Note: If there are foreign key constraints (e.g. tickets), this might fail.
            // For now, we assume simple deletion or ON DELETE CASCADE is set up, 
            // or we accept it fails if tickets exist (user must delete tickets first).

            await query(deleteQuery, [
                { name: 'eventId', type: sql.Int, value: eventId }
            ]);

            return {
                status: 200,
                jsonBody: { message: "Event deleted successfully" }
            };

        } catch (error) {
            context.error(`Error deleting event: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
        }
    }
});
