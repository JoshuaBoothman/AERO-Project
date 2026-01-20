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
        console.log("Checking events Columns...");
        const eventCols = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'events'");
        console.log("events:", eventCols);

        console.log("Checking subevents Columns...");
        const subeventCols = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'subevents'");
        console.log("subevents:", subeventCols);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
