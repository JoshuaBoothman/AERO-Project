const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');

app.http('getCampgroundAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/campgrounds',
    handler: async (request, context) => {
        const eventId = request.params.eventId;
        const startDate = request.query.get('start_date');
        const endDate = request.query.get('end_date');

        if (!eventId) {
            return { status: 400, body: JSON.stringify({ error: "Missing event ID" }) };
        }

        try {
            const pool = await getPool();

            // 1. Get Event Dates if not provided
            let checkIn = startDate;
            let checkOut = endDate;

            if (!checkIn || !checkOut) {
                const eventRes = await pool.request()
                    .input('eid', sql.Int, eventId)
                    .query("SELECT start_date, end_date FROM events WHERE event_id = @eid");

                if (eventRes.recordset.length === 0) return { status: 404, body: "Event not found" };

                if (!checkIn) checkIn = eventRes.recordset[0].start_date.toISOString().split('T')[0];
                if (!checkOut) checkOut = eventRes.recordset[0].end_date.toISOString().split('T')[0];
            }

            // 2. Fetch Campgrounds & Sites with Availability Calc
            const query = `
                SELECT 
                    cg.campground_id, cg.name as campground_name, cg.map_image_url,
                    c.campsite_id, c.site_number, c.is_powered, c.price_per_night, c.full_event_price, c.map_coordinates, c.is_active,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM campsite_bookings cb
                            WHERE cb.campsite_id = c.campsite_id
                            AND cb.check_in_date < @end
                            AND cb.check_out_date > @start
                        ) THEN 0 
                        ELSE 1 
                    END as is_available
                FROM campgrounds cg
                JOIN campsites c ON c.campground_id = cg.campground_id
                WHERE cg.event_id = @eid
                AND c.is_active = 1
            `;

            const result = await pool.request()
                .input('eid', sql.Int, eventId)
                .input('start', sql.Date, checkIn)
                .input('end', sql.Date, checkOut)
                .query(query);

            // Group by campground
            const campgrounds = {};
            for (const row of result.recordset) {
                if (!campgrounds[row.campground_id]) {
                    campgrounds[row.campground_id] = {
                        campground_id: row.campground_id,
                        name: row.campground_name,
                        map_image_url: row.map_image_url,
                        sites: []
                    };
                }
                campgrounds[row.campground_id].sites.push({
                    campsite_id: row.campsite_id,
                    site_number: row.site_number,
                    is_powered: row.is_powered,
                    price_per_night: row.price_per_night,
                    full_event_price: row.full_event_price,
                    map_coordinates: row.map_coordinates,
                    is_available: !!row.is_available
                });
            }

            return {
                status: 200,
                jsonBody: {
                    check_in: checkIn,
                    check_out: checkOut,
                    campgrounds: Object.values(campgrounds)
                }
            };

        } catch (error) {
            context.logOrError ? context.logOrError(error) : console.error(error);
            return { status: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
        }
    }
});
