const fs = require('fs');
const path = require('path');

// Load env
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load settings", e);
}

const { query } = require('../src/lib/db');

async function run() {
    const tables = ['campsites', 'products', 'asset_types', 'subevents', 'event_ticket_types', 'events', 'asset_items'];
    for (const t of tables) {
        try {
            console.log(`--- Checking ${t} ---`);
            // Get columns from information schema to be sure
            const q = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${t}'
            `;
            const res = await query(q);
            const columns = res.map(r => r.COLUMN_NAME).join(', ');
            console.log(`Columns: ${columns}`);
        } catch (e) {
            console.log(`Error checking ${t}: ${e.message}`);
        }
    }
    process.exit(0);
}

run();
