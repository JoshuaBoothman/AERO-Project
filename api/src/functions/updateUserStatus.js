const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateUserStatus', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'manage/users/{userId}/status',
    handler: async (request, context) => {
        try {
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { userId } = request.params;
            const body = await request.json();
            const { is_locked } = body;

            if (typeof is_locked !== 'boolean') {
                return { status: 400, body: JSON.stringify({ error: "Invalid status value" }) };
            }

            await query("UPDATE users SET is_locked = @locked WHERE user_id = @id", [
                { name: 'locked', type: sql.Bit, value: is_locked },
                { name: 'id', type: sql.Int, value: userId }
            ]);

            return {
                status: 200,
                jsonBody: { message: "User status updated successfully", userId, is_locked }
            };

        } catch (error) {
            context.error(`Error updating user status: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
