const { app } = require('@azure/functions');
const { validateToken } = require('../lib/auth');
const { getPool, sql } = require('../lib/db');

app.http('getAdminOrders', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        // 2. Role Check (Must be Admin/Operational)
        // We need to check the DB for admin role.
        try {
            const pool = await getPool();
            const adminCheck = await pool.request()
                .input('uid', sql.Int, user.userId)
                .query("SELECT role FROM admin_users WHERE admin_user_id = @uid");

            if (adminCheck.recordset.length === 0) {
                return { status: 403, body: JSON.stringify({ error: "Access Denied: Not an Admin" }) };
            }
            // (Optional: Check specific roles if needed, currently schema allows 'Operational' or 'Admin')

            // 3. Fetch All Orders
            // detailed query to get user info + order info
            const result = await pool.request().query(`
                SELECT 
                    o.order_id, 
                    o.user_id, 
                    o.order_date, 
                    o.total_amount, 
                    o.payment_status, 
                    o.tax_invoice_number,
                    u.email as user_email,
                    p.first_name as user_first_name,
                    p.last_name as user_last_name,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count,
                    (SELECT TOP 1 e.name 
                     FROM order_items oi 
                     JOIN attendees a ON oi.attendee_id = a.attendee_id 
                     JOIN events e ON a.event_id = e.event_id 
                     WHERE oi.order_id = o.order_id) as event_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.user_id
                LEFT JOIN persons p ON u.user_id = p.user_id
                ORDER BY o.order_date DESC
            `);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };

        } catch (err) {
            context.log(err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});
