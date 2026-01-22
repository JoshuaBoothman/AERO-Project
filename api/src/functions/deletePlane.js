const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('deletePlane', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'planes/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const { id } = request.params;

        try {
            const pool = await getPool();

            // Verify ownership
            const checkRes = await pool.request()
                .input('pid', sql.Int, id)
                .input('uid', sql.Int, user.userId)
                .query(`
                    SELECT 1 
                    FROM planes pl
                    JOIN persons p ON pl.person_id = p.person_id
                    WHERE pl.plane_id = @pid AND p.user_id = @uid
                `);

            if (checkRes.recordset.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Plane not found or access denied" }) };
            }

            // Check dependencies (e.g., event_planes)
            // If the plane is linked to an event, we might want to block deletion or soft delete.
            // For now, let's check basic table existence of dependencies using a safe query
            // Assuming 'event_planes' exists as per schema
            const depRes = await pool.request()
                .input('pid', sql.Int, id)
                .query("SELECT COUNT(*) as count FROM event_planes WHERE plane_id = @pid");

            if (depRes.recordset[0].count > 0) {
                return { status: 409, body: JSON.stringify({ error: "Cannot delete plane as it is registered for an event. Please contact support." }) };
            }

            await pool.request()
                .input('pid', sql.Int, id)
                .query("DELETE FROM planes WHERE plane_id = @pid");

            return {
                status: 200,
                body: JSON.stringify({ message: "Plane deleted successfully" })
            };

        } catch (error) {
            context.log(`Error deleting plane: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
