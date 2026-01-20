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

async function getTables() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`;
        console.log("Tables:");
        result.recordset.forEach(row => console.log(row.TABLE_NAME));

        // Also get columns for a key table like 'events' or 'campsites' to be sure
        const columns = await sql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campsites'`;
        console.log("\nCampsites Columns:");
        columns.recordset.forEach(row => console.log(row.COLUMN_NAME));

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

getTables();
