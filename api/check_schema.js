process.env.SQL_CONNECTION_STRING = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
const { getPool } = require('./src/lib/db');

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
