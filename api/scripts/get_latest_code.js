const fs = require('fs');
const path = require('path');

async function getCode() {
    try {
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { query } = require('../src/lib/db');

        console.log("Fetching latest 5 attendees...");
        const res = await query(`
            SELECT TOP 5 
                a.attendee_id, 
                p.first_name, 
                p.last_name, 
                ett.name as ticket_type, 
                a.ticket_code 
            FROM attendees a
            JOIN persons p ON a.person_id = p.person_id
            JOIN event_ticket_types ett ON a.ticket_type_id = ett.ticket_type_id
            ORDER BY a.attendee_id DESC
        `);
        console.table(res);

    } catch (e) {
        console.error(e);
    }
}
getCode();
