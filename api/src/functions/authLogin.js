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
                const userRes = await query("SELECT user_id, password_hash, first_name, last_name, is_locked, is_email_verified FROM users WHERE email = @email", [
                    { name: 'email', type: sql.NVarChar, value: email }
                ]);
                if (userRes.length > 0) {
                    user = userRes[0];
                    if (user.is_locked) {
                        return { status: 403, body: "Account is locked. Please contact support." };
                    }
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

            // 3.1 Check Email Verification
            // Note: Admins might not have this/could be skipped, but good to enforce generally or just for regular users.
            // Since user object structure is slightly different for admins/users in DB, check the field existence or role.
            if (role === 'user' && user.is_email_verified === false) {
                return { status: 403, body: "Please verify your email address before logging in." };
            }

            // 4. Generate Token
            // Reverted to Env Var now that header issue is resolved
            const SECRET_KEY = process.env.JWT_SECRET || "dev-secret-key-change-me";
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
                        email: email, // Added email to response
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