const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const { query, sql } = require('../lib/db');

app.http('authResetPassword', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { token, newPassword } = await request.json();

            if (!token || !newPassword) {
                return { status: 400, body: 'Token and new password are required' };
            }

            if (newPassword.length < 6) {
                return { status: 400, body: 'Password must be at least 6 characters' };
            }

            // 1. Find user with matching token (not expired)
            let user = null;
            let tableName = '';
            let idColumn = '';

            // Check regular users first
            const userRes = await query(
                "SELECT user_id FROM users WHERE reset_password_token = @token AND reset_password_expires > GETDATE()",
                [{ name: 'token', type: sql.NVarChar, value: token }]
            );

            if (userRes.length > 0) {
                user = userRes[0];
                tableName = 'users';
                idColumn = 'user_id';
            } else {
                // Check admin users
                const adminRes = await query(
                    "SELECT admin_user_id FROM admin_users WHERE reset_password_token = @token AND reset_password_expires > GETDATE()",
                    [{ name: 'token', type: sql.NVarChar, value: token }]
                );
                if (adminRes.length > 0) {
                    user = adminRes[0];
                    user.user_id = user.admin_user_id;
                    tableName = 'admin_users';
                    idColumn = 'admin_user_id';
                }
            }

            if (!user) {
                return { status: 400, body: 'Invalid or expired reset token' };
            }

            // 2. Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 10);

            // 3. Update password and clear token
            await query(
                `UPDATE ${tableName} SET password_hash = @hash, reset_password_token = NULL, reset_password_expires = NULL WHERE ${idColumn} = @id`,
                [
                    { name: 'hash', type: sql.NVarChar, value: passwordHash },
                    { name: 'id', type: sql.Int, value: user.user_id }
                ]
            );

            context.log(`Password reset successful for ${tableName} ID: ${user.user_id}`);

            return {
                status: 200,
                body: JSON.stringify({ message: 'Password has been reset successfully. You can now log in.' })
            };

        } catch (error) {
            context.log(`Error in authResetPassword: ${error.message}`);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
