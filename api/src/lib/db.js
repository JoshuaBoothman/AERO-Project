const sql = require('mssql');

const config = process.env.SQL_CONNECTION_STRING;

// Singleton pool storage
let poolPromise;

// Helper to get or create the connection pool
async function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config)
            .then(pool => {
                console.log('Connected to SQL Server');
                return pool;
            })
            .catch(err => {
                console.error('Database Connection Failed! Bad Config: ', err);
                poolPromise = null;
                throw err;
            });
    }
    return poolPromise;
}

async function query(command, parameters = []) {
    try {
        const pool = await getPool();
        const request = pool.request();

        // Bind parameters
        // Usage: parameters = [{ name: 'email', type: sql.NVarChar, value: 'test@test.com' }]
        parameters.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(command);
        return result.recordset;
    } catch (err) {
        console.error("Query Error: ", err);
        throw err;
    }
}

module.exports = {
    query,
    getPool, // Exported for Transaction support
    sql      // Exported for types (sql.Int, etc.)
};