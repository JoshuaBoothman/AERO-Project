const sql = require('mssql');

const config = process.env.SQL_CONNECTION_STRING;

async function query(command, parameters = []) {
    try {
        const pool = await sql.connect(config);
        const request = pool.request();

        // Bind parameters if provided
        // Usage: parameters = [{ name: 'email', type: sql.NVarChar, value: 'test@test.com' }]
        parameters.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(command);
        return result.recordset;
    } catch (err) {
        console.error("Database Connection Error: ", err);
        throw err;
    }
}

module.exports = {
    query,
    sql // Export sql so we can use types (sql.Int, sql.NVarChar) in our functions
};