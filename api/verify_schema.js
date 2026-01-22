const sql = require('mssql');

const config = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_ticket_types' AND column_name = 'sort_order'`;
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
