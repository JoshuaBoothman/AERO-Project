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

        context.log(`Fetching sites for campground param id: ${campgroundId}`);

        if (!campgroundId) {
            return { status: 400, body: JSON.stringify({ error: "Missing Campground ID" }) };
        }

        try {
            // Validate SQL Types
            if (!sql || !sql.Int) {
                throw new Error("SQL Types (sql.Int) not loaded correctly from db module");
            }

            // Fetch Campground Info
            const campground = await query(
                "SELECT * FROM campgrounds WHERE campground_id = @id",
                [{ name: 'id', type: sql.Int, value: campgroundId }]
            );

            if (!campground || campground.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Campground not found" }) };
            }

            // Fetch Next Site Number
            const nextSiteResult = await query(
                "SELECT ISNULL(MAX(site_sort_index), 0) + 1 as next_num FROM campsites WHERE campground_id = @id",
                [{ name: 'id', type: sql.Int, value: campgroundId }]
            );
            const nextSiteNumber = nextSiteResult[0] ? nextSiteResult[0].next_num : 1;

            let sitesQuery = `
                SELECT 
                    c.campsite_id, 
                    c.site_number, 
                    c.is_powered, 
                    c.price_per_night, 
                    c.full_event_price,
                    c.extra_adult_price_per_night,
                    c.extra_adult_full_event_price,
                    c.map_coordinates, 
                    c.is_active,
                    0 as is_booked
                FROM campsites c 
                WHERE c.campground_id = @id
                ORDER BY c.site_sort_index ASC, c.site_number ASC
            `;

            const params = [{ name: 'id', type: sql.Int, value: campgroundId }];

            if (startDate && endDate) {
                sitesQuery = `
                    SELECT 
                        c.campsite_id, 
                        c.site_number, 
                        c.is_powered, 
                        c.price_per_night, 
                        c.full_event_price,
                        c.extra_adult_price_per_night,
                        c.extra_adult_full_event_price,
                        c.map_coordinates, 
                        c.is_active,
                        (
                            SELECT cb.check_in_date as check_in, cb.check_out_date as check_out
                            FROM campsite_bookings cb 
                            WHERE cb.campsite_id = c.campsite_id
                            AND cb.check_in_date < @end
                            AND cb.check_out_date > @start
                            FOR JSON PATH
                        ) AS bookings_json
                    FROM campsites c 
                    WHERE c.campground_id = @id
                    ORDER BY c.site_sort_index ASC, c.site_number ASC
                `;
                params.push({ name: 'start', type: sql.Date, value: startDate });
                params.push({ name: 'end', type: sql.Date, value: endDate });
            }

            const sitesRaw = await query(sitesQuery, params);

            const sites = sitesRaw.map(site => {
                let bookings = [];
                if (site.bookings_json) {
                    try {
                        bookings = JSON.parse(site.bookings_json);
                    } catch (e) {
                        context.log('Error parsing bookings JSON', e);
                    }
                }
                return {
                    ...site,
                    bookings: bookings,
                    is_booked: bookings.length > 0 ? 1 : 0 // Backwards compatibility for now
                };
            });

            return {
                status: 200,
                jsonBody: {
                    campground: campground[0],
                    sites: sites,
                    next_site_number: nextSiteNumber
                }
            };

        } catch (error) {
            context.log(`Error fetching campground ${campgroundId}: ${error.message}`);
            // Return specific error for debugging
            return { status: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
        }
    }
});
