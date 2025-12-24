const fs = require('fs');
const path = require('path');

async function verify() {
    try {
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { query } = require('../src/lib/db');

        console.log("Checking Pilot-Crew Links...");
        const res = await query(`
            SELECT 
                ppc.pilot_pit_crew_id,
                
                pilot_p.first_name as pilot_first_name,
                pilot_p.last_name as pilot_last_name,
                pilot_a.ticket_code as pilot_code,
                
                crew_p.first_name as crew_first_name,
                crew_p.last_name as crew_last_name,
                crew_a.ticket_code as crew_code,
                
                ppc.created_at
            FROM pilot_pit_crews ppc
            JOIN attendees pilot_a ON ppc.pilot_attendee_id = pilot_a.attendee_id
            JOIN persons pilot_p ON pilot_a.person_id = pilot_p.person_id
            JOIN attendees crew_a ON ppc.crew_attendee_id = crew_a.attendee_id
            JOIN persons crew_p ON crew_a.person_id = crew_p.person_id
        `);

        if (res.length > 0) {
            console.log(JSON.stringify(res, null, 2));
        } else {
            console.log("No links found.");
        }

    } catch (e) {
        console.error(e);
    }
}
verify();
