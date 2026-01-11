const fs = require('fs');
const path = require('path');

// Manually load settings because we aren't running via 'func start'
try {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) {
        Object.assign(process.env, settings.Values);
    }
} catch (e) {
    console.error("Failed to load settings:", e.message);
}

const { query } = require('./src/lib/db');

async function debugOrg() {
    try {
        console.log("Querying organization_settings...");
        const result = await query("SELECT TOP 1 * FROM organization_settings");
        console.log("Result JSON:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

debugOrg();
