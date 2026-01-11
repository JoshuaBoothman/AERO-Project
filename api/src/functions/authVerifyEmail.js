const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');

app.http('authVerifyEmail', {
    methods: ['POST'], // Changed to POST for security, but GET is common for links. The client will handle the link parameter and call this POST.
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { token } = await request.json();

            if (!token) {
                return { status: 400, body: "Missing verification token." };
            }

            // 1. Find user with valid token
            const userQuery = `
                SELECT user_id, verification_token_expires 
                FROM users 
                WHERE verification_token = @token
            `;

            const users = await query(userQuery, [
                { name: 'token', type: sql.NVarChar, value: token }
            ]);

            if (users.length === 0) {
                return { status: 400, body: "Invalid or expired token." };
            }

            const user = users[0];

            // 2. Check Expiry
            if (new Date() > new Date(user.verification_token_expires)) {
                return { status: 400, body: "Verification token has expired." };
            }

            // 3. Update User
            const updateQuery = `
                UPDATE users 
                SET is_email_verified = 1, verification_token = NULL, verification_token_expires = NULL 
                WHERE user_id = @userId
            `;

            await query(updateQuery, [
                { name: 'userId', type: sql.Int, value: user.user_id }
            ]);

            return { status: 200, body: JSON.stringify({ message: "Email verified successfully." }) };

        } catch (error) {
            context.log(`Error in authVerifyEmail: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});
