const { query } = require('../src/lib/db');

async function run() {
    const tables = ['campsites', 'asset_types', 'subevents', 'products', 'event_ticket_types'];
    for (const t of tables) {
        try {
            const res = await query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${t}' AND COLUMN_NAME = 'name'
            `);
            if (res.length > 0) {
                console.log(`[OK] ${t} has 'name' column.`);
            } else {
                console.log(`[FAIL] ${t} does NOT have 'name' column.`);
                // List what it DOES have
                const all = await query(`SELECT TOP 5 COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t}'`);
                console.log(`      First 5 columns: ${all.map(x => x.COLUMN_NAME).join(', ')}`);
            }
        } catch (e) {
            console.log(`Error checking ${t}: ${e.message}`);
        }
    }
    process.exit(0);
}

run();
