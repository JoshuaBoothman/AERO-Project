const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const bcrypt = require('bcryptjs');
const { validateToken } = require('../lib/auth');

app.http('createAdmin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'manage/admins',
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { first_name, last_name, email, password, role } = await request.json();

            if (!first_name || !last_name || !email || !password) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields." }) };
            }

            // 3. Check for existing email
            const check = await query("SELECT admin_user_id FROM admin_users WHERE email = @email", [
                { name: 'email', type: sql.NVarChar, value: email }
            ]);

            if (check.length > 0) {
                return { status: 409, body: JSON.stringify({ error: "Admin with this email already exists." }) };
            }

            // 4. Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 5. Insert
            // Defaulting is_active to 1, role to input or 'admin'
            const insertQuery = `
                INSERT INTO admin_users (first_name, last_name, email, password_hash, role, is_active)
                OUTPUT INSERTED.admin_user_id, INSERTED.first_name, INSERTED.last_name, INSERTED.email, INSERTED.role, INSERTED.is_active
                VALUES (@first_name, @last_name, @email, @hash, @role, 1)
            `;

            const result = await query(insertQuery, [
                { name: 'first_name', type: sql.NVarChar, value: first_name },
                { name: 'last_name', type: sql.NVarChar, value: last_name },
                { name: 'email', type: sql.NVarChar, value: email },
                { name: 'hash', type: sql.NVarChar, value: hashedPassword },
                { name: 'role', type: sql.NVarChar, value: role || 'admin' }
            ]);

            return {
                status: 201,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error creating admin: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
