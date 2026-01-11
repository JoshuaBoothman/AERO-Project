const { app } = require('@azure/functions');
const { query } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getAdmins', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manage/admins',
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Query
            const queryString = `
                SELECT admin_user_id, first_name, last_name, email, role, is_active, created_at 
                FROM admin_users 
                ORDER BY created_at DESC
            `;
            const result = await query(queryString);

            return {
                status: 200,
                jsonBody: result
            };

        } catch (error) {
            context.error(`Error fetching admins: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
