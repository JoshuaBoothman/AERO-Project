const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
Object.assign(process.env, settings.Values);
const { sql, getPool } = require('./src/lib/db');

async function debug() {
    try {
        const pool = await getPool();

        console.log('--- Recent Paid Orders and their Transactions ---');
        const query = `
            SELECT TOP 20 
                o.order_id, 
                o.total_amount, 
                o.payment_status, 
                o.booking_source,
                t.transaction_id,
                t.amount as trans_amount,
                t.payment_method,
                t.status as trans_status
            FROM orders o
            LEFT JOIN transactions t ON o.order_id = t.order_id
            WHERE o.payment_status = 'Paid' OR o.payment_status = 'Partially Paid'
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
