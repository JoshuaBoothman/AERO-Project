const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('getCampsites', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'campgrounds/{id}/sites',
    handler: async (request, context) => {
        const campgroundId = request.params.id;

        if (!campgroundId) {
            return { status: 400, body: JSON.stringify({ error: "Missing Campground ID" }) };
        }

        try {
            // Fetch Campground Info + All Sites
            const campground = await query(
                "SELECT * FROM campgrounds WHERE campground_id = @id",
                [{ name: 'id', type: sql.Int, value: campgroundId }]
            );

            if (campground.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campground not found" }) };
            }

            const sites = await query(
                "SELECT campsite_id, site_number, is_powered, price_per_night, map_coordinates, is_active FROM campsites WHERE campground_id = @id",
                [{ name: 'id', type: sql.Int, value: campgroundId }]
            );

            return {
                status: 200,
                jsonBody: {
                    campground: campground[0],
                    sites: sites
                }
            };

        } catch (error) {
            context.log.error(`Error fetching campground ${campgroundId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
