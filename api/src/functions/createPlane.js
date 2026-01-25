const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('createPlane', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'planes',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const {
                person_id,
                name,
                model_type,
                registration_number,
                is_heavy_model,
                heavy_model_cert_number,
                heavy_model_cert_image_url,
                weight_kg
            } = await request.json();

            if (!person_id || !name || !registration_number) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields (Person, Make/Name, Rego)" }) };
            }

            if (is_heavy_model && (!weight_kg || !heavy_model_cert_number || !heavy_model_cert_image_url)) {
                return { status: 400, body: JSON.stringify({ error: "Heavy models require Weight, Certificate Number, and Certificate File." }) };
            }

            const pool = await getPool();

            // 1. Verify Ownership: Does this person belong to the user?
            const personCheck = await pool.request()
                .input('pid', sql.Int, person_id)
                .input('uid', sql.Int, user.userId)
                .query("SELECT 1 FROM persons WHERE person_id = @pid AND user_id = @uid");

            if (personCheck.recordset.length === 0) {
                return { status: 403, body: JSON.stringify({ error: "Invalid person selection. You can only register planes for your own managed profiles." }) };
            }

            // 2. Insert Plane
            await pool.request()
                .input('pid', sql.Int, person_id)
                .input('name', sql.NVarChar, name)
                .input('model', sql.NVarChar, model_type || '')
                .input('rego', sql.NVarChar, registration_number)
                .input('is_heavy', sql.Bit, is_heavy_model ? 1 : 0)
                .input('h_cert', sql.NVarChar, heavy_model_cert_number || null)
                .input('h_url', sql.NVarChar, heavy_model_cert_image_url || null)
                .input('weight', sql.Decimal(10, 2), weight_kg || 0)
                .query(`
                    INSERT INTO planes (person_id, name, model_type, registration_number, is_heavy_model, heavy_model_cert_number, heavy_model_cert_image_url, weight_kg)
                    VALUES (@pid, @name, @model, @rego, @is_heavy, @h_cert, @h_url, @weight)
                `);

            return {
                status: 201,
                body: JSON.stringify({ message: "Plane registered successfully" })
            };

        } catch (error) {
            context.log(`Error creating plane: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});
