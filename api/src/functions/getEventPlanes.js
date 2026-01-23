const { app } = require('@azure/functions');
const { validateToken, isAdmin } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getEventPlanes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manual/reports/event-planes', // Avoid 'admin/' prefix if reserved, similar to camping report
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
        }

        const eventId = request.query.get('eventId');
        if (!eventId) {
            return { status: 400, body: JSON.stringify({ error: "Missing eventId" }) };
        }

        try {
            const pool = await getPool();
            const result = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT 
                        pl.plane_id,
                        pl.name AS plane_name,
                        pl.model_type,
                        pl.weight_kg,
                        pl.is_heavy_model,
                        pl.heavy_model_cert_number,
                        pl.heavy_model_cert_image_url,
                        p.first_name,
                        p.last_name,
                        p.email,
                        a.status AS attendee_status
                    FROM attendees a
                    JOIN persons p ON a.person_id = p.person_id
                    JOIN planes pl ON p.person_id = pl.person_id
                    WHERE a.event_id = @eid
                    AND a.status IN ('Registered', 'CheckedIn')
                    ORDER BY p.last_name, p.first_name
                `);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };

        } catch (error) {
            context.log(`Error fetching event planes: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
