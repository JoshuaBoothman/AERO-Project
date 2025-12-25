const fs = require('fs');
const path = require('path');

async function checkLinking() {
    try {
        // Setup Env from local.settings.json
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { getPool, sql } = require('../src/lib/db');
        const pool = await getPool();

        console.log("--- Latest 5 Pilot-Pit Crew Links ---");
        const query = `
            SELECT TOP 5
                link.pilot_pit_crew_id as link_id,
                p_attendee.ticket_code as pilot_code,
                p_person.first_name as pilot_first,
                p_person.last_name as pilot_last,
                c_attendee.ticket_code as crew_code,
                c_person.first_name as crew_first,
                c_person.last_name as crew_last,
                c_attendee.status as crew_status
            FROM pilot_pit_crews link
            JOIN attendees p_attendee ON link.pilot_attendee_id = p_attendee.attendee_id
            JOIN persons p_person ON p_attendee.person_id = p_person.person_id
            JOIN attendees c_attendee ON link.crew_attendee_id = c_attendee.attendee_id
            JOIN persons c_person ON c_attendee.person_id = c_person.person_id
            ORDER BY link.pilot_pit_crew_id DESC
        `;

        const result = await pool.request().query(query);
        console.table(result.recordset);

        console.log("\n--- Latest 5 Orders with Attendees ---");
        const orderQuery = `
            SELECT TOP 5
                o.order_id,
                o.total_amount,
                o.payment_status,
                COUNT(a.attendee_id) as attendee_count
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN attendees a ON oi.attendee_id = a.attendee_id
            GROUP BY o.order_id, o.total_amount, o.payment_status
            ORDER BY o.order_id DESC
        `;
        const orderResult = await pool.request().query(orderQuery);
        console.table(orderResult.recordset);

        process.exit(0);
    } catch (err) {
        console.error("Error checking linking:", err);
        process.exit(1);
    }
}

checkLinking();
