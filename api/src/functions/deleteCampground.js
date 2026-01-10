const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('deleteCampground', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'campgrounds/{id}',
    handler: async (request, context) => {
        const id = request.params.id;

        if (!id) return { status: 400, body: JSON.stringify({ error: "Missing ID" }) };

        try {
            // Delete sites first (FK constraint usually requires this unless CASCADE is on)
            await query("DELETE FROM campsites WHERE campground_id = @id", [{ name: 'id', type: sql.Int, value: id }]);

            // Delete campground
            await query("DELETE FROM campgrounds WHERE campground_id = @id", [{ name: 'id', type: sql.Int, value: id }]);

            return { status: 200, jsonBody: { message: "Campground deleted" } };

        } catch (error) {
            context.log.error('Delete error:', error);
            if (error && error.message && error.message.includes('REFERENCE constraint')) {
                return { status: 400, body: JSON.stringify({ error: "Cannot delete: Campground has active bookings." }) };
            }
            return { status: 500, body: JSON.stringify({ error: `Delete failed: ${error.message}` }) };
        }
    }
});
