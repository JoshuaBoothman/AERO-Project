const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.SQL_CONNECTION_STRING;

const config = {
    user: connectionString.match(/User ID=([^;]+)/)[1],
    password: connectionString.match(/Password=([^;]+)/)[1],
    server: connectionString.match(/Server=tcp:([^,]+)/)[1],
    database: 'master',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function listDatabases() {
    const pool = new sql.ConnectionPool(config);
    try {
        await pool.connect();
        const result = await pool.request().query("SELECT name, state_desc FROM sys.databases WHERE name = 'sqldb-aero-dev'");
        if (result.recordset.length > 0) {
            console.log('Database found:', result.recordset[0]);
        } else {
            console.log('Database sqldb-aero-dev NOT found.');
        }
    } catch (err) {
        console.error('Error listing databases:', err);
    } finally {
        await pool.close();
    }
}

listDatabases();
