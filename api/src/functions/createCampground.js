const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createCampground', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'campgrounds',
    handler: async (request, context) => {
        try {
            // 1. Auth Check
            const user = validateToken(request);
            if (!user) {
                return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // 2. Parse Body
            const { event_id, name, map_image_url } = await request.json();

            if (!event_id || !name) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields" }) };
            }

            // 3. Insert Database
            const insertQuery = `
                INSERT INTO campgrounds (event_id, name, map_image_url)
                OUTPUT INSERTED.campground_id
                VALUES (@eventId, @name, @mapUrl)
            `;

            const result = await query(insertQuery, [
                { name: 'eventId', type: sql.Int, value: event_id },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'mapUrl', type: sql.NVarChar, value: map_image_url || null }
            ]);

            return {
                status: 201,
                body: JSON.stringify({
                    message: "Campground created",
                    campground_id: result[0].campground_id
                })
            };

        } catch (error) {
            context.error(`Error in createCampground: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
