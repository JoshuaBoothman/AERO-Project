const fs = require('fs');

async function run() {
    try {
        const settings = JSON.parse(fs.readFileSync('local.settings.json', 'utf8'));
        process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;

        // Require db AFTER setting env var
        const { getPool } = require('./src/lib/db');

        const pool = await getPool();
        const result = await pool.request().query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');
        console.log("Current Tables:", result.recordset.map(r => r.TABLE_NAME).join(', '));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
