const fs = require('fs');
const path = require('path');
const { getPool } = require('./src/lib/db');

// Load environment variables from local.settings.json
try {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values) {
            Object.assign(process.env, settings.Values);
        }
    }
} catch (e) {
    console.error("Failed to load local.settings.json:", e);
}

async function listTables() {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        console.log("Tables found:");
        result.recordset.forEach(row => console.log(`- ${row.TABLE_NAME}`));

        const tablesOfInterest = ['products', 'product_skus', 'product_variants', 'variant_categories', 'variant_options'];
        for (const table of tablesOfInterest) {
            // Check if table exists first to avoid error
            if (result.recordset.some(r => r.TABLE_NAME === table)) {
                const cols = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
                if (cols.recordset.length > 0) {
                    console.log(`\nRequirements for ${table}:`);
                    cols.recordset.forEach(c => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

listTables();
