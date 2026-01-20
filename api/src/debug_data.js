const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '../local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) Object.assign(process.env, settings.Values);
}
const { query } = require('./lib/db');

async function debugData() {
    try {
        console.log('--- Public Registrations ---');
        const regs = await query('SELECT TOP 5 id, public_event_day_id FROM public_registrations ORDER BY created_at DESC');
        console.table(regs);

        if (regs.length > 0) {
            const dayId = regs[0].public_event_day_id;
            console.log(`--- Public Event Day (ID: ${dayId}) ---`);
            const days = await query(`SELECT id, event_id FROM public_event_days WHERE id = ${dayId}`);
            console.table(days);

            if (days.length > 0) {
                const eventId = days[0].event_id;
                console.log(`--- Event (ID: ${eventId}) ---`);
                const events = await query(`SELECT event_id, name, slug FROM events WHERE event_id = ${eventId}`);
                console.table(events);

                console.log(`Target Slug: ${events[0]?.slug}`);
            }
        }
    } catch (e) {
        console.log(e.message);
    }
}
debugData();
