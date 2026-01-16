const fs = require('fs');
const path = require('path');

// Load env locally
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

const { query } = require('./api/src/lib/db');

async function run() {
    try {
        console.log("--- Campsites Columns ---");
        const campsites = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campsites'");
        console.log(JSON.stringify(campsites, null, 2));

        console.log("--- Campgrounds Columns ---");
        const campgrounds = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campgrounds'");
        console.log(JSON.stringify(campgrounds, null, 2));

        console.log("\n--- Event Planes Columns ---");
        const eventPlanes = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'event_planes'");
        console.log(JSON.stringify(eventPlanes, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Script Error:", e);
        process.exit(1);
    }
}

run();
