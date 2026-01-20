const fs = require('fs');
const path = require('path');

// Load Env FIRST
const settingsPath = path.join(__dirname, '../local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) {
        Object.assign(process.env, settings.Values);
    }
}

// Then require DB
const { query } = require('./lib/db');

async function fix() {
    try {
        console.log('Checking schema...');
        const cols = await query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'public_event_days' 
            AND COLUMN_NAME IN ('start_time', 'end_time')
        `);
        console.table(cols);

        const startTime = cols.find(c => c.COLUMN_NAME === 'start_time');
        if (startTime && startTime.DATA_TYPE !== 'time') {
            console.log(`Fixing start_time (current: ${startTime.DATA_TYPE})...`);
            await query("ALTER TABLE public_event_days ALTER COLUMN start_time TIME(7)");
        }

        const endTime = cols.find(c => c.COLUMN_NAME === 'end_time');
        if (endTime && endTime.DATA_TYPE !== 'time') {
            console.log(`Fixing end_time (current: ${endTime.DATA_TYPE})...`);
            await query("ALTER TABLE public_event_days ALTER COLUMN end_time TIME(7)");
        }

        console.log('Schema update complete.');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

fix();
