const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateCampground', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'campgrounds/{id}',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const campgroundId = request.params.id;
        const { name, map_image_url } = await request.json();

        if (!campgroundId) {
            return { status: 400, body: JSON.stringify({ error: "Missing campground ID" }) };
        }

        if (!name) {
            return { status: 400, body: JSON.stringify({ error: "Name is required" }) };
        }

        try {
            const pool = await getPool();

            // Dynamic Update Query
            let query = `UPDATE campgrounds SET name = @name`;
            if (map_image_url !== undefined) {
                query += `, map_image_url = @mapUrl`;
            }
            query += ` WHERE campground_id = @id`;

            const req = pool.request()
                .input('id', sql.Int, campgroundId)
                .input('name', sql.NVarChar, name);

            if (map_image_url !== undefined) {
                req.input('mapUrl', sql.NVarChar, map_image_url);
            }

            const result = await req.query(query);

            if (result.rowsAffected[0] === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campground not found" }) };
            }

            return {
                status: 200,
                jsonBody: { message: "Campground updated", name }
            };

        } catch (error) {
            context.log.error(`Error updating campground ${campgroundId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
