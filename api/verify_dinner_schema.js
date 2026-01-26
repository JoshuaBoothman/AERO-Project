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

async function verifySchema() {
    try {
        await sql.connect(config);

        console.log("Checking 'events' table for 'dinner_date'...");
        const eventsResult = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'dinner_date'
        `;
        if (eventsResult.recordset.length > 0) {
            console.log("✅ 'dinner_date' found in 'events':", eventsResult.recordset[0]);
        } else {
            console.error("❌ 'dinner_date' NOT found in 'events'");
        }

        console.log("\nChecking 'attendees' table for 'attending_dinner'...");
        const attendeesResult = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'attendees' AND COLUMN_NAME = 'attending_dinner'
        `;
        if (attendeesResult.recordset.length > 0) {
            console.log("✅ 'attending_dinner' found in 'attendees':", attendeesResult.recordset[0]);
        } else {
            console.error("❌ 'attending_dinner' NOT found in 'attendees'");
        }

    } catch (err) {
        console.error("Database connection error:", err);
    } finally {
        await sql.close();
    }
}

verifySchema();
