const fs = require('fs');
const path = require('path');

// Load env from local.settings.json
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load local.settings.json", e);
}

const { getPool, query } = require('../src/lib/db');

async function debug() {
    try {
        console.log('Connecting...');
        await getPool();

        console.log('--- EVENTS ---');
        const ev = await query("SELECT event_id, name, slug FROM events");
        console.log(JSON.stringify(ev, null, 2));

        console.log('--- ASSET TYPES ---');
        const at = await query("SELECT asset_type_id, event_id, name FROM asset_types");
        console.log(JSON.stringify(at, null, 2));

        console.log('--- ASSET ITEMS ---');
        const ai = await query("SELECT asset_item_id, asset_type_id, identifier, status FROM asset_items");
        console.log(JSON.stringify(ai, null, 2));

        console.log('--- EXISTING HIRES ---');
        const ah = await query("SELECT * FROM asset_hires");
        console.log(JSON.stringify(ah, null, 2));

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    }
}

debug();
