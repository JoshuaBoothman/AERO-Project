const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getUserOrders', {
    methods: ['GET'],
    route: 'orders',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const decoded = validateToken(request);
        if (!decoded) {
            return { status: 401, body: "Unauthorized" };
        }

        try {
            const sqlQuery = `
                SELECT 
                    o.order_id, 
                    o.order_date, 
                    o.total_amount, 
                    o.payment_status, 
                    o.tax_invoice_number,
                    e.name as event_name,
                    e.slug as event_slug,
                    e.banner_url
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                -- Join strictly to get event details via attendees -> event
                -- We use DISTINCT because an order might have multiple items for the same event
                JOIN attendees a ON oi.attendee_id = a.attendee_id
                JOIN events e ON a.event_id = e.event_id
                WHERE o.user_id = @userId
                GROUP BY o.order_id, o.order_date, o.total_amount, o.payment_status, o.tax_invoice_number, e.name, e.slug, e.banner_url
                ORDER BY o.order_date DESC
            `;

            // Note: The GROUP BY is required if we have multiple items, to avoid duplicates if we joined simply. 
            // However, typically an order is for ONE event context in this app? 
            // Actually, the cart allows multiple ticket types, but are they all for the same event?
            // Currently yes, the Cart is event-specific in the UI logic, but schema allows mixing?
            // "Cart" in current UI is per-event.

            const result = await query(sqlQuery, [
                { name: 'userId', type: sql.Int, value: decoded.userId }
            ]);

            return {
                status: 200,
                body: JSON.stringify(result)
            };

        } catch (error) {
            context.log(`Error in getUserOrders: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});
