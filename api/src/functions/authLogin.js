const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, sql } = require('../lib/db');

app.http('authLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email, password } = await request.json();

            let user = null;
            let role = 'user';

            // 1. Check Admin Users first
            const adminRes = await query("SELECT admin_user_id, password_hash, first_name, last_name, role FROM admin_users WHERE email = @email", [
                { name: 'email', type: sql.NVarChar, value: email }
            ]);

            if (adminRes.length > 0) {
                user = adminRes[0];
                role = user.role || 'admin'; // Use DB role or default
                user.user_id = user.admin_user_id; // Normalize ID
            } else {
                // 2. Check Regular Users
                const userRes = await query("SELECT user_id, password_hash, first_name, last_name FROM users WHERE email = @email", [
                    { name: 'email', type: sql.NVarChar, value: email }
                ]);
                if (userRes.length > 0) {
                    user = userRes[0];
                }
            }

            if (!user) {
                return { status: 401, body: "Invalid credentials" };
            }

            // 3. Compare Password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return { status: 401, body: "Invalid credentials" };
            }

            // 4. Generate Token
            // NUCLEAR FIX: Hardcoded secret to bypass Env Var issues
            const SECRET_KEY = "super-secret-azure-fix-2025";
            const token = jwt.sign(
                { userId: user.user_id, email: email, role },
                SECRET_KEY,
                { expiresIn: '8h' }
            );

            // 5. Return Token & User Info
            return {
                status: 200,
                body: JSON.stringify({
                    token,
                    user: {
                        id: user.user_id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        role
                    },
                    debug_secret_prefix: SECRET_KEY.substring(0, 3) + "***"
                })
            };

        } catch (error) {
            context.log(`Error in authLogin: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});