
const sql = require('mssql');

const config = {
    server: 'sql-aero-dev-jb.database.windows.net',
    database: 'sqldb-aero-dev',
    user: 'aero_admin',
    password: 'ZiJZ2SUjFBAWLeL',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function check() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT ticket_type_id, name, price, system_role, price_no_flight_line FROM event_ticket_types WHERE system_role = 'pilot'`;
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
