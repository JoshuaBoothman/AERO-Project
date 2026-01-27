const fs = require('fs');
const path = require('path');

// Load settings
const settingsPath = path.join(__dirname, '../local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
}

const { getPool } = require('../src/lib/db');

async function check() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT name, system_role FROM event_ticket_types");
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
