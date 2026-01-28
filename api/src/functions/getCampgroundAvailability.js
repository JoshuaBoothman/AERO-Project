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

            // 1. ALWAYS get event dates for the booking grid (full event period)
            const eventRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query("SELECT start_date, end_date FROM events WHERE event_id = @eid");

            if (eventRes.recordset.length === 0) return { status: 404, body: "Event not found" };

            const eventStart = eventRes.recordset[0].start_date.toISOString().split('T')[0];
            const eventEnd = eventRes.recordset[0].end_date.toISOString().split('T')[0];

            // User-selected dates (for availability check) - default to event dates
            const checkIn = startDate || eventStart;
            const checkOut = endDate || eventEnd;

            // 2. Fetch Campgrounds & Sites
            const sitesQuery = `
                SELECT 
                    cg.campground_id, cg.name as campground_name, cg.map_image_url,
                    c.campsite_id, c.site_number, c.is_powered, c.price_per_night, c.full_event_price, 
                    c.extra_adult_price_per_night, c.extra_adult_full_event_price,
                    c.map_coordinates, c.is_active
                FROM campgrounds cg
                JOIN campsites c ON c.campground_id = cg.campground_id
                WHERE cg.event_id = @eid
                AND c.is_active = 1
            `;

            const sitesResult = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(sitesQuery);

            // 3. Fetch ALL bookings for these campsites within the FULL EVENT period
            //    This is for displaying the booking grid
            const campsiteIds = sitesResult.recordset.map(r => r.campsite_id);
            let bookingsMap = {}; // campsite_id -> [{ check_in, check_out }]

            if (campsiteIds.length > 0) {
                // Query bookings for the entire event period
                const bookingsQuery = `
                    SELECT campsite_id, check_in_date, check_out_date
                    FROM campsite_bookings
                    WHERE campsite_id IN (${campsiteIds.join(',')})
                    AND check_in_date < @eventEnd
                    AND check_out_date > @eventStart
                `;

                const bookingsResult = await pool.request()
                    .input('eventStart', sql.Date, eventStart)
                    .input('eventEnd', sql.Date, eventEnd)
                    .query(bookingsQuery);

                for (const booking of bookingsResult.recordset) {
                    if (!bookingsMap[booking.campsite_id]) {
                        bookingsMap[booking.campsite_id] = [];
                    }
                    bookingsMap[booking.campsite_id].push({
                        check_in: booking.check_in_date.toISOString().split('T')[0],
                        check_out: booking.check_out_date.toISOString().split('T')[0]
                    });
                }
            }

            // 4. Group by campground and attach bookings
            //    is_available is calculated based on USER-SELECTED dates (checkIn/checkOut)
            const campgrounds = {};
            for (const row of sitesResult.recordset) {
                if (!campgrounds[row.campground_id]) {
                    campgrounds[row.campground_id] = {
                        campground_id: row.campground_id,
                        name: row.campground_name,
                        map_image_url: row.map_image_url,
                        sites: []
                    };
                }

                const siteBookings = bookingsMap[row.campsite_id] || [];

                // Check availability for USER-SELECTED dates
                // A site is available if NO booking overlaps with [checkIn, checkOut)
                // Remember: checkout day is available (night-based logic)
                // Conflict exists if: booking.check_in < userCheckOut AND booking.check_out > userCheckIn
                const hasConflict = siteBookings.some(booking => {
                    return booking.check_in < checkOut && booking.check_out > checkIn;
                });
                const isAvailable = !hasConflict;

                campgrounds[row.campground_id].sites.push({
                    campsite_id: row.campsite_id,
                    site_number: row.site_number,
                    is_powered: row.is_powered,
                    price_per_night: row.price_per_night,
                    full_event_price: row.full_event_price,
                    extra_adult_price_per_night: row.extra_adult_price_per_night,
                    extra_adult_full_event_price: row.extra_adult_full_event_price,
                    map_coordinates: row.map_coordinates,
                    is_available: isAvailable,
                    bookings: siteBookings  // ALL bookings for the event period
                });
            }

            return {
                status: 200,
                jsonBody: {
                    event_start: eventStart,  // Full event period for grid
                    event_end: eventEnd,
                    check_in: checkIn,        // User-selected dates
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

