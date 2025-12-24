const fs = require('fs');
const path = require('path');

async function check() {
    try {
        // 1. Setup Env First
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        // 2. Require DB after Env is set
        const { query } = require('../src/lib/db');

        // 3. Check Ticket Types
        console.log("Checking Ticket Types...");
        const tickets = await query('SELECT ticket_type_id, name, system_role, is_pit_crew FROM event_ticket_types');
        console.table(tickets);

        // 4. Check Attendees (Ticket Codes)
        console.log("\nChecking Latest Attendees...");
        const att = await query('SELECT TOP 5 attendee_id, ticket_type_id, ticket_code FROM attendees ORDER BY attendee_id DESC');
        console.table(att);

        // 5. Check Links
        console.log("\nChecking Pilot-Crew Links...");
        const links = await query('SELECT * FROM pilot_pit_crews');
        console.table(links);

    } catch (e) {
        console.error(e);
    }
}
check();
