const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('debugDashboard', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-dashboard',
    handler: async (request, context) => {
        const logs = [];
        const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

        log("Function started");

        try {
            // 1. Auth Check - Hardcoded Key via lib/auth
            let user = null;
            try {
                user = validateToken(request);
                log(`Auth check result: ${user ? 'User found (' + user.email + ')' : 'No user'}`);
            } catch (authErr) {
                log(`Auth error: ${authErr.message}`);
            }

            if (!user) {
                return { status: 200, jsonBody: { error: "Auth failed", logs } };
            }

            // 2. DB Connection
            log("Connecting to DB...");
            const pool = await getPool();
            log("DB Connected");

            // 3. Events List
            log("Fetching events list...");
            const eventsRes = await pool.request().query("SELECT event_id, name, start_date, end_date FROM events ORDER BY start_date DESC");
            log(`Found ${eventsRes.recordset.length} events`);

            if (eventsRes.recordset.length === 0) {
                return { status: 200, jsonBody: { error: "No events in DB", logs } };
            }

            const eventId = eventsRes.recordset[0].event_id;
            log(`Selected Event ID: ${eventId}`);

            // 4. Test Queries individually to find the crasher

            // Attendees
            try {
                log("Querying Attendees...");
                await pool.request().input('eid', sql.Int, eventId).query(`
                    SELECT count(*) as c FROM attendees WHERE event_id = @eid
                `);
                log("Attendees query OK");
            } catch (e) { log(`Attendees Failed: ${e.message}`); }

            // Camping
            try {
                log("Querying Camping...");
                await pool.request().input('eid', sql.Int, eventId).query(`
                    SELECT count(*) as c FROM campgrounds WHERE event_id = @eid
                `);
                log("Camping query OK");
            } catch (e) { log(`Camping Failed: ${e.message}`); }

            // Subevents
            try {
                log("Querying Subevents...");
                await pool.request().input('eid', sql.Int, eventId).query(`
                    SELECT count(*) as c FROM subevents WHERE event_id = @eid
                `);
                log("Subevents query OK");
            } catch (e) { log(`Subevents Failed: ${e.message}`); }

            // Orders
            try {
                log("Querying Orders (Merch)...");
                await pool.request().input('eid', sql.Int, eventId).query(`
                    SELECT TOP 1 * FROM order_items oi 
                    JOIN attendees a ON oi.attendee_id = a.attendee_id
                    WHERE a.event_id = @eid
                `);
                log("Orders query OK");
            } catch (e) { log(`Orders Failed: ${e.message}`); }

            // Assets
            try {
                log("Querying Assets...");
                await pool.request().input('eid', sql.Int, eventId).query(`
                    SELECT TOP 1 * FROM asset_hires ah
                    JOIN order_items oi ON ah.order_item_id = oi.order_item_id
                    JOIN attendees a ON oi.attendee_id = a.attendee_id
                    WHERE a.event_id = @eid
                `);
                log("Assets query OK");
            } catch (e) { log(`Assets Failed: ${e.message}`); }

            return {
                status: 200,
                jsonBody: { success: true, logs }
            };

        } catch (error) {
            log(`FATAL GLOBAL ERROR: ${error.message}`);
            return {
                status: 200, // Return 200 so user can see the logs in browser
                jsonBody: { error: "Fatal Error", logs }
            };
        }
    }
});
