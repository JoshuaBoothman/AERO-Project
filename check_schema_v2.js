const fs = require('fs');
const path = require('path');

// Load env locally since we are running via node
try {
    const settingsPath = path.join(__dirname, 'api/local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load settings", e);
}

// Require db AFTER setting env var
const { query } = require('./api/src/lib/db');

async function run() {
    try {
        console.log("Checking event_ticket_types...");
        const cols = await query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'event_ticket_types'");
        console.log("event_ticket_types Columns:", cols.map(c => c.COLUMN_NAME));

        console.log("Checking Tables...");
        const tables = await query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log("Tables:", tables.map(t => t.TABLE_NAME));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
