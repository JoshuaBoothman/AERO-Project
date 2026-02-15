const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
Object.assign(process.env, settings.Values);
const { sql, getPool } = require('./src/lib/db');

async function debug() {
    try {
        const pool = await getPool();
        console.log('--- Recent Transactions ---');
        const transactions = await pool.request().query("SELECT TOP 5 * FROM transactions ORDER BY timestamp DESC");
        console.log(JSON.stringify(transactions.recordset, null, 2));

        console.log('\n--- Recent Orders ---');
        const orders = await pool.request().query("SELECT TOP 5 order_id, total_amount, payment_status, amount_paid FROM orders ORDER BY order_date DESC");
        console.log(JSON.stringify(orders.recordset, null, 2));

        console.log('\n--- Check Join ---');
        // Check for orders with transactions
        const joinCheck = await pool.request().query(`
            SELECT TOP 5 o.order_id, t.transaction_id, t.payment_method, t.status
            FROM orders o
            JOIN transactions t ON o.order_id = t.order_id
            ORDER BY t.timestamp DESC
        `);
        console.log(JSON.stringify(joinCheck.recordset, null, 2));

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

debug();
