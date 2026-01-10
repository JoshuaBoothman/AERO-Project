const fs = require('fs');
const path = require('path');

// Load env from local.settings.json
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load local.settings.json", e);
}

const { getPool, query, sql } = require('../src/lib/db');

async function debug() {
    try {
        await getPool();
        console.log('--- DEBUGGING ORDER EVENT LINK ---');

        // 1. Fetch Order #26 Items
        const orderId = 26;
        console.log(`fetching items for order ${orderId}...`);

        const items = await query(`SELECT * FROM order_items WHERE order_id = ${orderId}`);
        console.table(items);

        if (items.length > 0) {
            const attendeeId = items[0].attendee_id;
            console.log(`Checking Attendee ${attendeeId}...`);
            const attendees = await query(`SELECT * FROM attendees WHERE attendee_id = ${attendeeId}`);
            console.table(attendees);

            if (attendees.length > 0) {
                const eventId = attendees[0].event_id;
                console.log(`Checking Event ${eventId}...`);
                const events = await query(`SELECT * FROM events WHERE event_id = ${eventId}`);
                console.table(events);
            }
        }

        // 2. Run the actual subquery
        console.log('--- RUNNING SUBQUERY ---');
        const list = await query(`
            SELECT 
                o.order_id, 
                (SELECT TOP 1 e.name 
                 FROM order_items oi 
                 JOIN attendees a ON oi.attendee_id = a.attendee_id 
                 JOIN events e ON a.event_id = e.event_id 
                 WHERE oi.order_id = o.order_id) as event_name
            FROM orders o
            WHERE o.order_id = ${orderId}
        `);
        console.table(list);

    } catch (e) {
        console.error(e);
    }
}

debug();
