const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.SQL_CONNECTION_STRING;

async function verifyConnection() {
    try {
        console.log('Using connection string from local.settings.json');
        await sql.connect(connectionString);
        const result = await sql.query`SELECT DB_NAME() AS CurrentDB`;
        console.log('Connected successfully!');
        console.log('Current Database:', result.recordset[0].CurrentDB);

        if (result.recordset[0].CurrentDB === 'sqldb-aero-dev') {
            console.log('SUCCESS: Connected to the Development Database.');
        } else {
            console.error('WARNING: Connected to ' + result.recordset[0].CurrentDB + ' instead of sqldb-aero-dev!');
        }
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await sql.close();
    }
}

verifyConnection();
