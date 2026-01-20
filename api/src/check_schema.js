const fs = require('fs');
const path = require('path');
const { query } = require('./lib/db');

async function checkSchema() {
    try {
        // Load env from local.settings.json
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            if (settings.Values) {
                Object.assign(process.env, settings.Values);
            }
        }

        console.log('Checking column types for public_event_days...');
        const result = await query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'public_event_days' 
            AND COLUMN_NAME IN ('start_time', 'end_time')
        `);
        console.table(result);
    } catch (e) {
        console.log('Error checking schema:', e.message);
    }
}

checkSchema();
