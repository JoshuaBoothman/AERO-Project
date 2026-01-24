
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
        const result = await sql.query`
            SELECT e.slug 
            FROM event_ticket_types t
            JOIN events e ON t.event_id = e.event_id
            WHERE t.ticket_type_id = 18
        `;
        console.log(result.recordset[0].slug);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
