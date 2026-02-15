const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
Object.assign(process.env, settings.Values);
const { sql, getPool } = require('./src/lib/db');

async function debug() {
    try {
        const pool = await getPool();

        let query = `
            SELECT TOP 5
                o.order_id, 
                o.user_id, 
                o.order_date, 
                o.total_amount, 
                o.payment_status, 
                o.tax_invoice_number,
                u.email as user_email,
                p.first_name as user_first_name,
                p.last_name as user_last_name,
                (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.order_id) as item_count,
                (SELECT TOP 1 e.name 
                    FROM order_items oi 
                    JOIN attendees a ON oi.attendee_id = a.attendee_id 
                    JOIN events e ON a.event_id = e.event_id 
                    WHERE oi.order_id = o.order_id) as event_name,
                (SELECT TOP 1 e.event_id 
                    FROM order_items oi 
                    JOIN attendees a ON oi.attendee_id = a.attendee_id 
                    JOIN events e ON a.event_id = e.event_id 
                    WHERE oi.order_id = o.order_id) as event_id,
                pm.payment_method
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            OUTER APPLY (
                SELECT TOP 1 first_name, last_name 
                FROM persons 
                WHERE user_id = u.user_id
            ) p
            OUTER APPLY (
                    SELECT TOP 1 payment_method
                    FROM transactions t
                    WHERE t.order_id = o.order_id AND t.status = 'Success'
                    ORDER BY t.timestamp DESC
            ) pm
            WHERE 1=1
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
