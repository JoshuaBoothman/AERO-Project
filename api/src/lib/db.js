const sql = require('mssql');

const config = process.env.SQL_CONNECTION_STRING;

async function query(command) {
    try {
        // Connect to the database
        let pool = await sql.connect(config);
        
        // Execute the query
        let result = await pool.request().query(command);
        
        return result.recordset;
    } catch (err) {
        console.error("Database Connection Error: ", err);
        throw err;
    }
}

module.exports = {
    query
};