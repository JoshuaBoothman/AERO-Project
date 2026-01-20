const fs = require('fs');
const path = require('path');

// Read settings
const settingsPath = path.join(__dirname, 'api', 'local.settings.json');
try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
    console.log("Loaded connection string from local.settings.json");
} catch (e) {
    console.error("Could not load local.settings.json", e);
    process.exit(1);
}

// Now require db
const { query } = require('./api/src/lib/db');

async function run() {
    try {
        console.log("Testing connection...");
        const tables = await query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        console.log("Connected Successfully. Tables:");
        tables.forEach(t => console.log(`- ${t.TABLE_NAME}`));
        process.exit(0);
    } catch (err) {
        console.error("Connection Failed", err);
        process.exit(1);
    }
}

run();
