const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateCampsiteCoords', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'campsites/{id}/coords',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const campsiteId = request.params.id;
        const body = await request.json();
        const { map_coordinates } = body;

        if (!campsiteId || map_coordinates === undefined) {
            return { status: 400, body: JSON.stringify({ error: "Missing campsite ID or coordinates" }) };
        }

        // Convert to string if object
        const coordsString = typeof map_coordinates === 'object'
            ? JSON.stringify(map_coordinates)
            : map_coordinates;

        try {
            const pool = await getPool();
            const result = await pool.request()
                .input('coords', sql.NVarChar, coordsString)
                .input('id', sql.Int, campsiteId)
                .query("UPDATE campsites SET map_coordinates = @coords WHERE campsite_id = @id");

            if (result.rowsAffected[0] === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campsite not found" }) };
            }

            return {
                status: 200,
                jsonBody: {
                    message: "Coordinates updated",
                    campsite_id: campsiteId,
                    map_coordinates: coordsString
                }
            };

        } catch (error) {
            context.log.error(`Error updating campsite ${campsiteId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
