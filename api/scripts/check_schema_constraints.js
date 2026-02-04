const fs = require('fs');
const path = require('path');

try {
    process.env.SQL_CONNECTION_STRING = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
} catch (e) {
    console.error("Failed to load local.settings.json", e);
}

const { getPool, sql } = require('../src/lib/db');

(async () => {
    try {
        const pool = await getPool();

        console.log(`\n--- campsite_bookings columns ---`);
        const res = await pool.request()
            .query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campsite_bookings'");

        console.log(res.recordset.map(r => r.COLUMN_NAME).join('\n'));

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
