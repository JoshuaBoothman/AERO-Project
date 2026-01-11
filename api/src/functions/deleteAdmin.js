const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteAdmin', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'manage/admins/{id}',
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            const adminIdToDelete = parseInt(request.params.id);

            // 2. Prevent Self-Deletion
            // user.userId comes from the token payload. 
            // NOTE: Ensure your token payload uses 'userId' for admin IDs correctly
            if (user.userId === adminIdToDelete) {
                return {
                    status: 400,
                    body: JSON.stringify({ error: "You cannot delete your own account." })
                };
            }

            // 3. Delete
            const deleteQuery = "DELETE FROM admin_users WHERE admin_user_id = @id";
            const result = await query(deleteQuery, [
                { name: 'id', type: sql.Int, value: adminIdToDelete }
            ]);

            // rowsAffected is not directly returned by common mssql wrapper unless configured, 
            // checking if we can select before delete or just assume success if no error.
            // A better way is to use OUTPUT DELETED.* to see if something was actually deleted.

            // For simplicity, we'll try to DELETE and if no rows affected (which isn't easily exposed by simple wrappers sometimes), 
            // we assume it's done or ID didn't exist.
            // Let's use a check first approach for better 404

            // Actually, let's use the OUTPUT clause
            const checkQuery = "DELETE FROM admin_users OUTPUT DELETED.admin_user_id WHERE admin_user_id = @id";
            const deleteResult = await query(checkQuery, [
                { name: 'id', type: sql.Int, value: adminIdToDelete }
            ]);

            if (deleteResult.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Admin not found." }) };
            }

            return {
                status: 200,
                jsonBody: { message: "Admin deleted successfully." }
            };

        } catch (error) {
            context.error(`Error deleting admin: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
