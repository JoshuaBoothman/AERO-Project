const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getPlanes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'planes',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const pool = await getPool();
            const result = await pool.request()
                .input('uid', sql.Int, user.userId)
                .query(`
                    SELECT 
                        pl.plane_id,
                        pl.person_id,
                        pl.name,
                        pl.model_type,
                        pl.registration_number,
                        pl.is_heavy_model,
                        pl.heavy_model_cert_number,
                        pl.heavy_model_cert_image_url,
                        pl.weight_kg,
                        p.first_name,
                        p.last_name
                    FROM planes pl
                    JOIN persons p ON pl.person_id = p.person_id
                    WHERE p.user_id = @uid
                `);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };

        } catch (error) {
            context.log(`Error fetching planes: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
