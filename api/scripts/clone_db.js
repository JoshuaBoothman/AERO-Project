const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load local settings
const settingsPath = path.join(__dirname, '../local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.SQL_CONNECTION_STRING;

// Parse connection string to get server and credentials, but force database to 'master'
// Azure requires connecting to 'master' to execute CREATE DATABASE
const config = {
    user: connectionString.match(/User ID=([^;]+)/)[1],
    password: connectionString.match(/Password=([^;]+)/)[1],
    server: connectionString.match(/Server=tcp:([^,]+)/)[1],
    database: 'master', // Must connect to master
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function cloneDatabase() {
    console.log('Connecting to master database...');
    const pool = new sql.ConnectionPool(config);

    try {
        await pool.connect();
        console.log('Connected to master.');

        const sourceDb = 'sqldb-aero-master';
        const targetDb = 'sqldb-aero-dev';

        console.log(`Cloning ${sourceDb} to ${targetDb}...`);
        console.log('This operation is asynchronous on Azure side and might take a few minutes.');

        // Check if DB exists first? 
        // For now, let's just try to create it. If it exists, it will fail.

        const request = pool.request();
        await request.query(`CREATE DATABASE [${targetDb}] AS COPY OF [${sourceDb}];`);

        console.log(`Database clone command executed successfully.`);
        console.log(`Please wait a few minutes for the operation to complete on Azure before connecting.`);

    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('Target database already exists. Proceeding...');
        } else {
            console.error('Error cloning database:', err);
            process.exit(1);
        }
    } finally {
        await pool.close();
    }
}

cloneDatabase();
