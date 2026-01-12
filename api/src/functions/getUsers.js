const { app } = require('@azure/functions');
const { query } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manage/users',
    handler: async (request, context) => {
        try {
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Fetch users, excluding sensitive info like passwords
            // We order by last_name by default
            const result = await query(`
                SELECT user_id, email, first_name, last_name, is_email_verified, is_locked 
                FROM users 
                ORDER BY last_name ASC
            `);

            return {
                status: 200,
                jsonBody: result
            };

        } catch (error) {
            context.error(`Error fetching users: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
