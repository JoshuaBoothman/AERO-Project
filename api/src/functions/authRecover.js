const { app } = require('@azure/functions');
const crypto = require('crypto');
const { query, sql } = require('../lib/db');
const { sendPasswordResetEmail } = require('../lib/emailService');

app.http('authRecover', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email } = await request.json();
            const origin = request.headers.get('origin') || process.env.SITE_URL || 'http://localhost:5173';

            if (!email) {
                return { status: 400, body: 'Email is required' };
            }

            // 1. Check if user exists in users or admin_users
            let user = null;
            let tableName = '';
            let idColumn = '';

            // Check regular users first
            const userRes = await query(
                "SELECT user_id, first_name, email FROM users WHERE email = @email",
                [{ name: 'email', type: sql.NVarChar, value: email }]
            );

            if (userRes.length > 0) {
                user = userRes[0];
                tableName = 'users';
                idColumn = 'user_id';
            } else {
                // Check admin users
                const adminRes = await query(
                    "SELECT admin_user_id, first_name, email FROM admin_users WHERE email = @email",
                    [{ name: 'email', type: sql.NVarChar, value: email }]
                );
                if (adminRes.length > 0) {
                    user = adminRes[0];
                    user.user_id = user.admin_user_id;
                    tableName = 'admin_users';
                    idColumn = 'admin_user_id';
                }
            }

            // 2. Generic response to prevent email enumeration
            if (!user) {
                context.log(`Password reset requested for non-existent email: ${email}`);
                return {
                    status: 200,
                    body: JSON.stringify({ message: 'If an account exists for this email, you will receive a password reset link shortly.' })
                };
            }

            // 3. Generate token and expiry
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            // 4. Update user record with token and expiry
            await query(
                `UPDATE ${tableName} SET reset_password_token = @token, reset_password_expires = @expires WHERE ${idColumn} = @id`,
                [
                    { name: 'token', type: sql.NVarChar, value: token },
                    { name: 'expires', type: sql.DateTime, value: expiresAt },
                    { name: 'id', type: sql.Int, value: user.user_id }
                ]
            );

            // 5. Send email
            const emailResult = await sendPasswordResetEmail(email, token, user.first_name, origin);
            if (!emailResult.success) {
                context.log(`Failed to send password reset email: ${JSON.stringify(emailResult.error)}`);
            }

            return {
                status: 200,
                body: JSON.stringify({ message: 'If an account exists for this email, you will receive a password reset link shortly.' })
            };

        } catch (error) {
            context.log(`Error in authRecover: ${error.message}`);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
