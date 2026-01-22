const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('updatePlane', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'planes/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const { id } = request.params;
        const { name, model_type, registration_number, is_heavy_model, heavy_model_cert_number, heavy_model_cert_image_url, weight_kg } = await request.json();

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

            await pool.request()
                .input('pid', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('model', sql.NVarChar, model_type)
                .input('rego', sql.NVarChar, registration_number)
                .input('ish', sql.Bit, is_heavy_model ? 1 : 0)
                .input('cert', sql.NVarChar, heavy_model_cert_number || null)
                .input('url', sql.NVarChar, heavy_model_cert_image_url || null)
                .input('w', sql.Decimal(10, 2), weight_kg || 0)
                .query(`
                    UPDATE planes 
                    SET 
                        name = @name,
                        model_type = @model,
                        registration_number = @rego,
                        is_heavy_model = @ish,
                        heavy_model_cert_number = @cert,
                        heavy_model_cert_image_url = @url,
                        weight_kg = @w
                    WHERE plane_id = @pid
                `);

            return {
                status: 200,
                body: JSON.stringify({ message: "Plane updated successfully" })
            };

        } catch (error) {
            context.log(`Error updating plane: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
