const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('createGalleryItem', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'gallery',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { url, filename, media_type, caption } = body;

            if (!url || !filename || !media_type) {
                return { status: 400, jsonBody: { error: 'Missing required fields: url, filename, media_type' } };
            }

            const sql = `
                INSERT INTO gallery_items (url, filename, media_type, caption, is_active)
                OUTPUT INSERTED.*
                VALUES (@url, @filename, @media_type, @caption, 1)
            `;

            const params = [
                { name: 'url', type: db.sql.NVarChar, value: url },
                { name: 'filename', type: db.sql.NVarChar, value: filename },
                { name: 'media_type', type: db.sql.NVarChar, value: media_type },
                { name: 'caption', type: db.sql.NVarChar, value: caption || null }
            ];

            const result = await db.query(sql, params);

            return {
                status: 201,
                jsonBody: result[0]
            };
        } catch (error) {
            context.error('Error creating gallery item:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to create gallery item' }
            };
        }
    }
});
