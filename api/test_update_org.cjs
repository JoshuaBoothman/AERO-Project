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

const { query, sql } = require('./src/lib/db');

async function updateTest() {
    try {
        console.log("Updating organization_settings...");
        await query(`
            UPDATE organization_settings
            SET 
                primary_color = '#FF0000',
                secondary_color = '#00FF00',
                accent_color = '#0000FF'
        `);
        console.log("Update complete.");

        const result = await query("SELECT TOP 1 * FROM organization_settings");
        console.log("New Settings:", JSON.stringify(result[0], null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

updateTest();
