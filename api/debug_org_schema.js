const fs = require('fs');
const path = require('path');

// Load env vars
const settingsPath = path.join(__dirname, 'local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) {
        Object.assign(process.env, settings.Values);
    }
}

const { query } = require('./src/lib/db');

async function run() {
    try {
        // Check columns
        const columns = await query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'organization_settings'
        `);
        console.log("Cols:", columns.map(c => c.COLUMN_NAME));

        // Check data
        const data = await query("SELECT TOP 1 * FROM organization_settings");
        console.log("Data:", data);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
