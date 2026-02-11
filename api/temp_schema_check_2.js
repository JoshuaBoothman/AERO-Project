const sql = require('mssql');

const config = {
    user: 'aero_admin',
    password: 'ZiJZ2SUjFBAWLeL',
    server: 'sql-aero-dev-jb.database.windows.net',
    database: 'sqldb-aero-dev',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function getColumns() {
    try {
        await sql.connect(config);

        const tables = ['attendees', 'event_ticket_types'];
        for (const table of tables) {
            const columns = await sql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${table}`;
            console.log(`\n${table} Columns:`);
            columns.recordset.forEach(row => console.log(row.COLUMN_NAME));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

getColumns();
