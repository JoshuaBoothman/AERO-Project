const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getOrderDetail', {
    methods: ['GET'],
    route: 'orders/{orderId}',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const decoded = validateToken(request);
        if (!decoded) {
            return { status: 401, body: "Unauthorized" };
        }

        const orderId = request.params.orderId;

        try {
            // 1. Fetch Order Header & Verify Ownership
            const orderQuery = `
                SELECT 
                    o.order_id, 
                    o.order_date, 
                    o.total_amount, 
                    o.payment_status, 
                    o.tax_invoice_number,
                    o.user_id
                FROM orders o
                WHERE o.order_id = @orderId
            `;

            const orderResult = await query(orderQuery, [
                { name: 'orderId', type: sql.Int, value: orderId }
            ]);

            if (orderResult.length === 0) {
                return { status: 404, body: "Order not found" };
            }

            const order = orderResult[0];

            // 2. Security Check
            if (order.user_id !== decoded.userId) {
                return { status: 403, body: "Forbidden: You do not own this order." };
            }

            // 3. Fetch Items (Tickets/Attendees)
            // We join to get Event info, Ticket Type info, Person info
            const itemsQuery = `
                SELECT 
                    oi.order_item_id,
                    oi.price_at_purchase,
                    oi.item_type,
                    ett.name as ticket_name,
                    ett.is_pilot,
                    ett.is_pit_crew,
                    p.first_name,
                    p.last_name,
                    p.email,
                    a.status as attendee_status,
                    a.ticket_code,
                    a.attendee_id,
                    e.name as event_name,
                    e.slug as event_slug,
                    e.banner_url
                FROM order_items oi
                JOIN attendees a ON oi.attendee_id = a.attendee_id
                JOIN event_ticket_types ett ON a.ticket_type_id = ett.ticket_type_id
                JOIN persons p ON a.person_id = p.person_id
                JOIN events e ON a.event_id = e.event_id
                WHERE oi.order_id = @orderId
            `;

            const itemsResult = await query(itemsQuery, [
                { name: 'orderId', type: sql.Int, value: orderId }
            ]);

            // 4. Construct Response
            // We'll attach the items to the order object
            // If there are multiple events (unlikely but possible), we pick the first one for the header
            // or we just return the list.

            const fullOrder = {
                ...order,
                event_name: itemsResult.length > 0 ? itemsResult[0].event_name : "Unknown Event",
                event_slug: itemsResult.length > 0 ? itemsResult[0].event_slug : "",
                banner_url: itemsResult.length > 0 ? itemsResult[0].banner_url : "",
                items: itemsResult
            };

            return {
                status: 200,
                body: JSON.stringify(fullOrder)
            };

        } catch (error) {
            context.log(`Error in getOrderDetail: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});
