const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('getCampsites', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'campgrounds/{id}/sites',
    handler: async (request, context) => {
        const campgroundId = request.params.id;
        const startDate = request.query.get('startDate'); // YYYY-MM-DD
        const endDate = request.query.get('endDate');     // YYYY-MM-DD

        if (!campgroundId) {
            return { status: 400, body: JSON.stringify({ error: "Missing Campground ID" }) };
        }

        try {
            // Fetch Campground Info
            const campground = await query(
                "SELECT * FROM campgrounds WHERE campground_id = @id",
                [{ name: 'id', type: sql.Int, value: campgroundId }]
            );

            if (campground.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campground not found" }) };
            }

            let sitesQuery = `
                SELECT 
                    c.campsite_id, 
                    c.site_number, 
                    c.is_powered, 
                    c.price_per_night, 
                    c.map_coordinates, 
                    c.is_active,
                    0 as is_booked
                FROM campsites c 
                WHERE c.campground_id = @id
            `;

            const params = [{ name: 'id', type: sql.Int, value: campgroundId }];

            if (startDate && endDate) {
                // Availability Logic: Overlap definition: (StartA < EndB) and (EndA > StartB)
                // We want to mark as booked if ANY booking overlaps.
                sitesQuery = `
                    SELECT 
                        c.campsite_id, 
                        c.site_number, 
                        c.is_powered, 
                        c.price_per_night, 
                        c.map_coordinates, 
                        c.is_active,
                        CASE WHEN EXISTS (
                            SELECT 1 FROM campsite_bookings cb 
                            WHERE cb.campsite_id = c.campsite_id
                            AND cb.check_in_date < @end
                            AND cb.check_out_date > @start
                        ) THEN 1 ELSE 0 END AS is_booked
                    FROM campsites c 
                    WHERE c.campground_id = @id
                `;
                params.push({ name: 'start', type: sql.Date, value: startDate });
                params.push({ name: 'end', type: sql.Date, value: endDate });
            }

            const sites = await query(sitesQuery, params);

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
