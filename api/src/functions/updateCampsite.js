const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateCampsite', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'campsites/{id}',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const campsiteId = request.params.id;
        const body = await request.json();
        const { site_number, is_powered, price_per_night, is_active, map_coordinates } = body;

        // Dynamic update query builder would be ideal, but let's stick to explicit updates for now.
        // We'll focus on site_number for renaming, but support others.

        if (!campsiteId) {
            return { status: 400, body: JSON.stringify({ error: "Missing campsite ID" }) };
        }

        try {
            const pool = await getPool();

            // Allow updating map_coordinates to null (unmap)
            let coordsValue = undefined;
            if (map_coordinates === null) coordsValue = null; // Explicit null for unmapping

            // Prepare inputs
            const req = pool.request().input('id', sql.Int, campsiteId);

            let updates = [];
            if (site_number !== undefined) {
                req.input('name', sql.NVarChar, site_number);
                updates.push("site_number = @name");
            }
            if (is_powered !== undefined) {
                req.input('powered', sql.Bit, is_powered);
                updates.push("is_powered = @powered");
            }
            if (map_coordinates === null) {
                updates.push("map_coordinates = NULL");
            }

            if (updates.length === 0) {
                return { status: 400, body: JSON.stringify({ error: "No fields to update" }) };
            }

            const query = `UPDATE campsites SET ${updates.join(', ')} WHERE campsite_id = @id`;

            const result = await req.query(query);

            if (result.rowsAffected[0] === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campsite not found" }) };
            }

            return {
                status: 200,
                jsonBody: { message: "Campsite updated" }
            };

        } catch (error) {
            context.log.error(`Error updating campsite ${campsiteId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
