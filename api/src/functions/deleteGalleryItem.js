const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('deleteGalleryItem', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'gallery/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;

            if (!id) {
                return { status: 400, jsonBody: { error: 'Missing gallery item ID' } };
            }

            // Soft delete
            const sql = 'UPDATE gallery_items SET is_active = 0 WHERE id = @id';
            const params = [
                { name: 'id', type: db.sql.Int, value: parseInt(id) }
            ];

            await db.query(sql, params);

            return {
                status: 200,
                jsonBody: { message: 'Gallery item deleted successfully' }
            };
        } catch (error) {
            context.error('Error deleting gallery item:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to delete gallery item' }
            };
        }
    }
});
