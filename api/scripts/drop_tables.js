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
    try {
        console.log("Dropping tables...");
        try { await query("DROP TABLE campsite_bookings"); } catch (e) { } // FK dependency
        try { await query("DROP TABLE campsites"); } catch (e) { }
        try { await query("DROP TABLE campground_sections"); } catch (e) { }
        console.log("Tables Dropped.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
