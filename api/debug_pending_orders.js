const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
Object.assign(process.env, settings.Values);
const { sql, getPool } = require('./src/lib/db');

async function debug() {
    try {
        const pool = await getPool();

        console.log('--- Pending Orders ---');
        const query = `
            SELECT TOP 20 
                o.order_id, 
                o.total_amount, 
                o.payment_status, 
                o.booking_source,
                o.amount_paid
            FROM orders o
            WHERE o.payment_status = 'Pending'
            ORDER BY o.order_date DESC
        `;

        const result = await pool.request().query(query);
        console.log(JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

debug();
