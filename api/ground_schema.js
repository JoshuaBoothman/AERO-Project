
process.env.SQL_CONNECTION_STRING = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
const { getPool } = require('./src/lib/db');

async function run() {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        console.log("SCHEMA_GROUNDING_RESULT:", JSON.stringify(result.recordset, null, 2));
    } catch (e) {
        console.error("SCHEMA_GROUNDING_ERROR:", e);
    }
    process.exit();
}

run();
