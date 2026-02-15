const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
Object.assign(process.env, settings.Values);
const { sql, getPool } = require('./src/lib/db');

async function debug() {
    try {
        const pool = await getPool();

        console.log('--- Paid Orders Without Transactions ---');
        // Find orders that are 'Paid' or 'Partially Paid' but have NO entry in transactions table
        const query = `
            SELECT TOP 10 o.order_id, o.order_date, o.total_amount, o.amount_paid, o.payment_status, o.booking_source
            FROM orders o
            LEFT JOIN transactions t ON o.order_id = t.order_id
            WHERE (o.payment_status = 'Paid' OR o.payment_status = 'Partially Paid')
            AND t.transaction_id IS NULL
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
