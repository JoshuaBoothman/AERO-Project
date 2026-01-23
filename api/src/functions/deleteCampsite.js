const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteCampsite', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'campsites/{id}',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const campsiteId = request.params.id;

        if (!campsiteId) {
            return { status: 400, body: JSON.stringify({ error: "Missing campsite ID" }) };
        }

        try {
            const pool = await getPool();

            // Check for dependencies (bookings) before deleting?
            // For now, let's assume we can delete if no bookings, or just try. 
            // DB constraints usually handle this, but let's check.

            /* 
            // Optional: Check bookings
            const r = await pool.request().input('id', sql.Int, campsiteId).query('SELECT COUNT(*) as c FROM campsite_bookings WHERE campsite_id = @id');
            if (r.recordset[0].c > 0) return { status: 400, body: JSON.stringify({error: "Cannot delete site with bookings"})};
            */

            const result = await pool.request()
                .input('id', sql.Int, campsiteId)
                .query("DELETE FROM campsites WHERE campsite_id = @id");

            if (result.rowsAffected[0] === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campsite not found" }) };
            }

            return {
                status: 200,
                jsonBody: { message: "Campsite deleted" }
            };

        } catch (error) {
            context.error(`Error deleting campsite ${campsiteId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
