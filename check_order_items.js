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
        const result = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'order_items' AND COLUMN_NAME = 'refunded_at'
        `;

        if (result.recordset.length > 0) {
            console.log("Column 'refunded_at' EXISTS in 'order_items'.");
        } else {
            console.log("Column 'refunded_at' MISSING in 'order_items'.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();
