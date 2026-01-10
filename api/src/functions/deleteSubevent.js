const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('deleteSubevent', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'subevents/{id}',
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Delete
            const deleteQuery = `DELETE FROM subevents WHERE subevent_id = @id`;

            await query(deleteQuery, [
                { name: 'id', type: sql.Int, value: id }
            ]);

            return {
                status: 200,
                jsonBody: { message: "Subevent deleted successfully" }
            };

        } catch (error) {
            context.error(`Error deleting subevent: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
