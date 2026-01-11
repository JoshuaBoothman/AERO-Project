const fs = require('fs');
const path = require('path');

// Load settings manually BEFORE requiring db
const settingsPath = path.resolve(__dirname, 'local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
}

const { getPool } = require('./src/lib/db');

async function run() {
    try {
        const pool = await getPool();
        const query = `
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('campsites', 'campgrounds', 'campground_sections')
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `;
        const result = await pool.request().query(query);
        console.table(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
