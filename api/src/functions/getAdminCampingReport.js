const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { isAdmin } = require('../lib/auth');

console.log("LOADED: getAdminCampingReport.js");

app.http('getAdminCampingReport', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'reports/camping-availability',
    handler: async (request, context) => {
        context.log(`[getAdminCampingReport] Request received. Query: ${request.url}`);

        // 1. Authorization
        // isAdmin expects the request object, not the header string
        const user = isAdmin(request);
        if (!user) {
            return { status: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const eventId = request.query.get('eventId');
        const startDate = request.query.get('start_date');
        const endDate = request.query.get('end_date');

        if (!eventId || !startDate || !endDate) {
            return { status: 400, body: JSON.stringify({ error: "Missing required parameters: eventId, start_date, end_date" }) };
        }

        try {
            const pool = await getPool();

            // query: Get all campsites and any overlapping bookings
            const query = `
                SELECT 
                    cg.campground_id, cg.name as campground_name,
                    c.campsite_id, c.site_number, c.is_powered,
                    cb.booking_id, cb.check_in_date, cb.check_out_date,
                    u.first_name, u.last_name, u.email,
                    o.order_id, o.payment_status
                FROM campsites c
                JOIN campgrounds cg ON c.campground_id = cg.campground_id
                LEFT JOIN campsite_bookings cb ON c.campsite_id = cb.campsite_id 
                    AND (cb.check_in_date < @end AND cb.check_out_date > @start)
                LEFT JOIN order_items oi ON cb.order_item_id = oi.order_item_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                LEFT JOIN users u ON o.user_id = u.user_id
                WHERE cg.event_id = @eid
                AND c.is_active = 1
                ORDER BY cg.name, c.site_number
            `;

            const result = await pool.request()
                .input('eid', sql.Int, eventId)
                .input('start', sql.Date, startDate)
                .input('end', sql.Date, endDate)
                .query(query);

            return {
                status: 200,
                jsonBody: result.recordset
            };

        } catch (error) {
            context.logOrError ? context.logOrError(error) : console.error(error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
