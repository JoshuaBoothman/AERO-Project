const { getPool } = require('./src/lib/db');

// Attempt to load from local.settings.json for dev convenience
try {
    const localSettings = require('./local.settings.json');
    if (localSettings.Values.SQL_CONNECTION_STRING) {
        process.env.SQL_CONNECTION_STRING = localSettings.Values.SQL_CONNECTION_STRING;
    }
} catch (e) {
    // local.settings.json not found or invalid, rely on existing environment variables
    if (!process.env.SQL_CONNECTION_STRING) {
        console.warn("Warning: SQL_CONNECTION_STRING not found in process.env or local.settings.json");
    }
}

async function checkSchema() {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'planes'");
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
