const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const bcrypt = require('bcryptjs');
const { validateToken } = require('../lib/auth');

app.http('updateAdmin', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'manage/admins/{id}',
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            const adminId = request.params.id;
            const { first_name, last_name, email, role, password, is_active } = await request.json();

            // 2. Build Query
            // Dynamic update logic
            let updates = [];
            let params = [{ name: 'id', type: sql.Int, value: adminId }];

            if (first_name) {
                updates.push("first_name = @first_name");
                params.push({ name: 'first_name', type: sql.NVarChar, value: first_name });
            }
            if (last_name) {
                updates.push("last_name = @last_name");
                params.push({ name: 'last_name', type: sql.NVarChar, value: last_name });
            }
            if (email) {
                updates.push("email = @email");
                params.push({ name: 'email', type: sql.NVarChar, value: email });
            }
            if (role) {
                updates.push("role = @role");
                params.push({ name: 'role', type: sql.NVarChar, value: role });
            }
            if (is_active !== undefined) {
                updates.push("is_active = @is_active");
                params.push({ name: 'is_active', type: sql.Bit, value: is_active });
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push("password_hash = @hash");
                params.push({ name: 'hash', type: sql.NVarChar, value: hashedPassword });
            }

            if (updates.length === 0) {
                return { status: 400, body: JSON.stringify({ error: "No fields to update." }) };
            }

            const updateQuery = `
                UPDATE admin_users
                SET ${updates.join(', ')}
                OUTPUT INSERTED.admin_user_id, INSERTED.first_name, INSERTED.last_name, INSERTED.email, INSERTED.role, INSERTED.is_active
                WHERE admin_user_id = @id
            `;

            const result = await query(updateQuery, params);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Admin not found." }) };
            }

            return {
                status: 200,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error updating admin: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
