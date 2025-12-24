const fs = require('fs');
const path = require('path');

async function update() {
    try {
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { query } = require('../src/lib/db');

        console.log("Enabling is_pit_crew for 'system_role' = 'crews'...");

        // Update query
        await query(`
            UPDATE event_ticket_types
            SET is_pit_crew = 1
            WHERE system_role = 'crews' OR name LIKE '%Crew%'
        `);

        // Check result
        const res = await query('SELECT ticket_type_id, name, system_role, is_pit_crew FROM event_ticket_types WHERE is_pit_crew = 1');
        console.log("Updated Tickets:");
        console.table(res);

    } catch (e) {
        console.error(e);
    }
}
update();
