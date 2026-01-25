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

async function check() {
    try {
        await sql.connect(config);

        console.log("--- Planes Table ---");
        const planes = await sql.query`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'planes'`;
        if (planes.recordset.length === 0) {
            console.log("Table 'planes' not found. Checking for tables with 'plane' in name...");
            const tables = await sql.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%plane%'`;
            tables.recordset.forEach(r => console.log(r.TABLE_NAME));
        } else {
            planes.recordset.forEach(r => console.log(`${r.COLUMN_NAME} (${r.DATA_TYPE})`));
        }

        console.log("\n--- Persons Table ---");
        const persons = await sql.query`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'persons'`;
        persons.recordset.forEach(r => console.log(`${r.COLUMN_NAME} (${r.DATA_TYPE})`));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

check();
