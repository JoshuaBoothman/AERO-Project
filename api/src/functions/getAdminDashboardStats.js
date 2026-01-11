const { app } = require('@azure/functions'); // Force reload
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getAdminDashboardStats', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/admin-stats',
    handler: async (request, context) => {
        context.log('[Dashboard] Request received');

        // 1. Auth Check - Admin Only
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            context.log('[Dashboard] Auth failed');
            return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
        }
        context.log('[Dashboard] Auth success for user:', user.email);

        try {
            context.log('[Dashboard] Connecting to DB pool...');
            const pool = await getPool();
            context.log('[Dashboard] DB Connected');

            const queryEventId = request.query.get('eventId');

            // 2. Determine Event to Show
            let eventId = queryEventId;
            let eventDetails = null;

            // Fetch list of all events for dropdown
            context.log('[Dashboard] Fetching events list...');
            const eventsListRes = await pool.request().query("SELECT event_id, name, start_date, end_date FROM events ORDER BY start_date DESC");
            const allEvents = eventsListRes.recordset;
            context.log(`[Dashboard] Found ${allEvents.length} events`);

            if (!eventId) {
                // Find next upcoming or current event
                // Filter where end_date >= now
                const now = new Date();
                // Sort by start_date ASC to get the *nearest* upcoming
                const upcoming = allEvents
                    .filter(e => new Date(e.end_date) >= now)
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                if (upcoming.length > 0) {
                    eventId = upcoming[0].event_id;
                } else if (allEvents.length > 0) {
                    // Fallback to most recent
                    eventId = allEvents[0].event_id;
                }
            }

            context.log('[Dashboard] Selected Event ID:', eventId);

            // Get Details for Selected Event
            if (eventId) {
                // Ensure eventId is int
                eventId = parseInt(eventId);
                eventDetails = allEvents.find(e => e.event_id === eventId);

                // Fetch Venue Name
                const venueRes = await pool.request()
                    .input('eid', sql.Int, eventId)
                    .query(`SELECT v.name as venue_name FROM events e JOIN venues v ON e.venue_id = v.venue_id WHERE e.event_id = @eid`);
                if (venueRes.recordset.length > 0) {
                    eventDetails.venue_name = venueRes.recordset[0].venue_name;
                }
            }

            if (!eventDetails) {
                context.log('[Dashboard] No event details found');
                return { status: 404, body: JSON.stringify({ error: "No events found" }) };
            }

            const stats = {
                event: eventDetails,
                eventsList: allEvents,
                attendees: [],
                camping: [],
                subevents: [],
                merch: { revenue: 0, items_sold: 0 },
                assets: { total_hires: 0 }
            };

            // 3. Attendee Stats (Breakdown by Ticket Type)
            context.log('[Dashboard] Fetching attendees...');
            const attendeeRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT t.name as ticket_name, t.is_pilot, COUNT(a.attendee_id) as count
                    FROM attendees a
                    JOIN event_ticket_types t ON a.ticket_type_id = t.ticket_type_id
                    WHERE a.event_id = @eid AND a.status = 'Registered'
                    GROUP BY t.name, t.is_pilot
                `);
            stats.attendees = attendeeRes.recordset;

            // 4. Camping Stats (Daily Breakdown per Campground)
            // Fetch Campgrounds
            context.log('[Dashboard] Fetching camping...');
            const campRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT 
                        cg.campground_id, cg.name, 
                        (SELECT COUNT(*) FROM campsites c WHERE c.campground_id = cg.campground_id AND c.is_active = 1) as capacity
                    FROM campgrounds cg
                    WHERE cg.event_id = @eid
                `);

            const campgrounds = campRes.recordset;
            const campingStats = [];

            // Generate Date Range (Daily)
            const getDates = (start, end) => {
                const dates = [];
                let current = new Date(start);
                const last = new Date(end);
                while (current <= last) {
                    dates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
                return dates;
            };

            const eventStart = new Date(eventDetails.start_date);
            const eventEnd = new Date(eventDetails.end_date);
            const dailyDates = getDates(eventStart, eventEnd);

            for (const camp of campgrounds) {
                // Fetch bookings for this campground during event range
                const bookingRes = await pool.request()
                    .input('cid', sql.Int, camp.campground_id)
                    .input('start', sql.Date, eventStart)
                    .input('end', sql.Date, eventEnd)
                    .query(`
                        SELECT cb.check_in_date, cb.check_out_date
                        FROM campsite_bookings cb
                        JOIN campsites c ON cb.campsite_id = c.campsite_id
                        WHERE c.campground_id = @cid
                        AND cb.check_in_date < @end
                        AND cb.check_out_date > @start
                    `);

                const bookings = bookingRes.recordset;

                // Calculate daily occupancy
                const dailyData = dailyDates.map(date => {
                    // Count bookings that cover this date (date >= check_in AND date < check_out)
                    // Note: check_out date is usually "morning of", so they stay the night before. 
                    // Occupancy for a "Day" usually means "Night of".
                    // Logic: Occupied if date >= check_in AND date < check_out
                    const count = bookings.filter(b => {
                        const inDate = new Date(b.check_in_date);
                        const outDate = new Date(b.check_out_date);
                        return date >= inDate && date < outDate;
                    }).length;

                    return {
                        date: date.toISOString().split('T')[0], // YYYY-MM-DD
                        booked: count,
                        capacity: camp.capacity
                    };
                });

                campingStats.push({
                    campground_id: camp.campground_id,
                    name: camp.name,
                    capacity: camp.capacity,
                    daily: dailyData
                });
            }
            stats.camping = campingStats;


            // 5. Subevents Stats
            context.log('[Dashboard] Fetching subevents...');
            const subRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT 
                        s.subevent_id, s.name, s.capacity,
                        (SELECT COUNT(*) FROM subevent_registrations sr 
                         JOIN order_items oi ON sr.order_item_id = oi.order_item_id
                         -- Ideally check if order is paid/valid, but for now count all registrations
                        WHERE sr.subevent_id = s.subevent_id) as registered
                    FROM subevents s
                    WHERE s.event_id = @eid
                `);
            stats.subevents = subRes.recordset;


            // 6. Merch & Assets
            // Merch Revenue & Count
            context.log('[Dashboard] Fetching merch...');
            const merchRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT 
                        SUM(oi.price_at_purchase) as total_revenue,
                        COUNT(oi.order_item_id) as items_sold
                    FROM order_items oi
                    JOIN attendees a ON oi.attendee_id = a.attendee_id
                    WHERE a.event_id = @eid
                    AND oi.item_type = 'Merchandise'
                `);
            if (merchRes.recordset.length > 0) {
                stats.merch = {
                    revenue: merchRes.recordset[0].total_revenue || 0,
                    items_sold: merchRes.recordset[0].items_sold || 0
                };
            }

            // Asset Hires Count
            context.log('[Dashboard] Fetching assets...');
            const assetRes = await pool.request()
                .input('eid', sql.Int, eventId)
                .query(`
                    SELECT COUNT(ah.asset_hire_id) as total_hires
                    FROM asset_hires ah
                    JOIN order_items oi ON ah.order_item_id = oi.order_item_id
                    JOIN attendees a ON oi.attendee_id = a.attendee_id
                    WHERE a.event_id = @eid
                `);
            if (assetRes.recordset.length > 0) {
                stats.assets = {
                    total_hires: assetRes.recordset[0].total_hires || 0
                };
            }

            context.log('[Dashboard] Success, returning data.');
            return {
                status: 200,
                jsonBody: stats
            };

        } catch (error) {
            context.log.error(`[Dashboard] Error: ${error.message}`);
            context.error(`Error fetching admin dashboard stats: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: `Dashboard Error: ${error.message}` }) };
        }
    }
});
