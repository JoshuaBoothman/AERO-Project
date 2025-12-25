const fs = require('fs');
const path = require('path');

async function checkLinking() {
    try {
        // Setup Env from local.settings.json
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { getPool, sql } = require('../src/lib/db');
        const pool = await getPool();

        console.log("--- Checking for Planes Table ---");
        const query = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'planes'
        `;
        const result = await pool.request().query(query);
        console.table(result.recordset);

        console.log("--- Checking for Event Planes Table ---");
        const query2 = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'event_planes'
        `;
        const result2 = await pool.request().query(query2);
        console.table(result2.recordset);

        console.log("\n--- Latest 5 Orders with Attendees ---");
        const orderQuery = `
            SELECT TOP 5
                o.order_id,
                o.total_amount,
                o.payment_status,
                COUNT(a.attendee_id) as attendee_count
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN attendees a ON oi.attendee_id = a.attendee_id
            GROUP BY o.order_id, o.total_amount, o.payment_status
            ORDER BY o.order_id DESC
        `;
        const orderResult = await pool.request().query(orderQuery);
        console.table(orderResult.recordset);

        process.exit(0);
    } catch (err) {
        console.error("Error checking linking:", err);
        process.exit(1);
    }
}

checkLinking();
