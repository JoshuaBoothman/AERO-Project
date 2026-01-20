const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '../local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) Object.assign(process.env, settings.Values);
}
const { query } = require('./lib/db');

async function checkData() {
    try {
        const joinResult = await query(`
            SELECT TOP 5 pr.ticket_code, e.slug, e.name
            FROM public_registrations pr
            JOIN public_event_days pd ON pr.public_event_day_id = pd.id
            JOIN events e ON pd.event_id = e.event_id
            ORDER BY pr.created_at DESC
        `);
        console.table(joinResult);
    } catch (e) {
        console.log(e.message);
    }
}
checkData();
