const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('getGalleryItems', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'gallery',
    handler: async (request, context) => {
        try {
            const items = await db.query('SELECT * FROM gallery_items WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC');
            return {
                status: 200,
                jsonBody: items
            };
        } catch (error) {
            context.error('Error fetching gallery items:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch gallery items' }
            };
        }
    }
});
