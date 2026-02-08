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

async function run() {
    try {
        await sql.connect(config);

        console.log("--- COLUMNS ---");
        const cols = await sql.query`SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'persons' AND COLUMN_NAME = 'email'`;
        console.log(cols.recordset);

        console.log("--- CONSTRAINTS ---");
        const constraints = await sql.query`
            SELECT 
                kc.CONSTRAINT_NAME, 
                kc.COLUMN_NAME, 
                tc.CONSTRAINT_TYPE 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kc
            JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                ON kc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
            WHERE kc.TABLE_NAME = 'persons' AND kc.COLUMN_NAME = 'email'
        `;
        console.log(constraints.recordset);

        console.log("--- INDEXES ---");
        const indexes = await sql.query`
            SELECT 
                ind.name AS IndexName, 
                ind.is_unique, 
                ind.has_filter, 
                ind.filter_definition 
            FROM sys.indexes ind 
            INNER JOIN sys.index_columns ic ON ind.object_id = ic.object_id and ind.index_id = ic.index_id 
            INNER JOIN sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id 
            INNER JOIN sys.tables t ON ind.object_id = t.object_id 
            WHERE t.name = 'persons' AND col.name = 'email'
        `;
        console.log(indexes.recordset);


    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

run();
