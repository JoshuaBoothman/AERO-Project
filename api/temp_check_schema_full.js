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

async function getTableColumns(tableName) {
    try {
        const result = await sql.query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`);
        console.log(`\n--- ${tableName} Columns ---`);
        result.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}, ${row.IS_NULLABLE})`));
    } catch (err) {
        console.error(`Error getting columns for ${tableName}:`, err);
    }
}

async function checkSchema() {
    try {
        await sql.connect(config);

        const tables = ['persons', 'attendees', 'orders', 'order_items', 'event_ticket_types'];

        for (const table of tables) {
            await getTableColumns(table);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();
