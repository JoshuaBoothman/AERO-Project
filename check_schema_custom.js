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

async function checkSchema() {
    try {
        await sql.connect(config);
        const columns = await sql.query`SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products'`;
        console.log("Products Columns:");
        columns.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();
