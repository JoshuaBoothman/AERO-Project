const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getLegacyBookings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const sqlQuery = `
                SELECT 
                    o.order_id,
                    cb.campsite_id,
                    c.site_number,
                    cb.check_in_date,
                    cb.check_out_date,
                    c.price_per_night,
                    c.full_event_price, 
                    c.campground_id, -- Added for frontend map loading
                    camp.event_id,
                    e.name as event_name,
                    e.slug as event_slug,
                    c.site_number as campsite_name -- sometimes site_number or name
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN campsite_bookings cb ON oi.order_item_id = cb.order_item_id
                JOIN campsites c ON cb.campsite_id = c.campsite_id
                JOIN campgrounds camp ON c.campground_id = camp.campground_id
                JOIN events e ON camp.event_id = e.event_id
                WHERE o.user_id = @userId
                AND o.booking_source = 'Legacy'
                AND o.payment_status = 'Pending'
            `;

            context.log(`Fetching legacy bookings for UserId: ${user.userId}`);

            const res = await query(sqlQuery, [
                { name: 'userId', type: sql.Int, value: user.userId }
            ]);

            context.log(`Found ${res.length} legacy bookings.`);

            return {
                status: 200,
                body: JSON.stringify(res)
            };

        } catch (error) {
            context.log(`Error in getLegacyBookings: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
