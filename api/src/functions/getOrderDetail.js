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

            // 2. Security Check (Owner or Admin)
            if (order.user_id !== decoded.userId && decoded.role !== 'admin' && decoded.role !== 'Operational') {
                return { status: 403, body: "Forbidden: You do not own this order." };
            }

            // 3. Fetch Items (Tickets/Attendees)
            // We join to get Event info, Ticket Type info, Person info
            const itemsQuery = `
                SELECT 
                    oi.order_item_id,
                    oi.price_at_purchase,
                    oi.item_type,
                    CASE 
                        WHEN oi.item_type = 'Merchandise' THEN p_prod.name 
                        ELSE ett.name 
                    END as ticket_name,
                    CASE 
                        WHEN oi.item_type = 'Merchandise' THEN NULL 
                        ELSE ett.system_role 
                    END as system_role,
                    p.first_name,
                    p.last_name,
                    p.email,
                    p.license_number,
                    p.person_id,
                    a.status as attendee_status,
                    a.ticket_code,
                    a.attendee_id,
                    e.name as event_name,
                    e.slug as event_slug,
                    e.banner_url,
                    -- Extra Fields for Merch
                    sku.sku_code,
                    p_prod.name as product_name
                FROM order_items oi
                JOIN attendees a ON oi.attendee_id = a.attendee_id
                JOIN event_ticket_types ett ON a.ticket_type_id = ett.ticket_type_id
                JOIN persons p ON a.person_id = p.person_id
                JOIN events e ON a.event_id = e.event_id
                LEFT JOIN product_skus sku ON oi.item_reference_id = sku.product_sku_id AND oi.item_type = 'Merchandise'
                LEFT JOIN products p_prod ON sku.product_id = p_prod.product_id
                WHERE oi.order_id = @orderId
            `;

            const itemsResult = await query(itemsQuery, [
                { name: 'orderId', type: sql.Int, value: orderId }
            ]);

            // 3.5 Fetch Planes for Pilot Attendees
            // Extract unique person IDs for pilots
            const pilotPersonIds = [...new Set(itemsResult.filter(i => i.system_role === 'pilot').map(i => i.person_id))];
            let planesMap = {};

            if (pilotPersonIds.length > 0) {
                const idsList = pilotPersonIds.join(',');
                // Ensure idsList only contains numbers to avoid injection (though map returning ints is safe)

                const planesReq = new sql.Request(await require('../lib/db').getPool());
                const planesQuery = `SELECT * FROM planes WHERE person_id IN (${idsList})`;

                const planesResult = await planesReq.query(planesQuery);

                // Group by person_id
                planesResult.recordset.forEach(plane => {
                    if (!planesMap[plane.person_id]) planesMap[plane.person_id] = [];
                    planesMap[plane.person_id].push(plane);
                });
            }

            // Attach planes to items
            const itemsWithPlanes = itemsResult.map(item => ({
                ...item,
                planes: planesMap[item.person_id] || []
            }));

            // 4. Construct Response
            // We'll attach the items to the order object
            // If there are multiple events (unlikely but possible), we pick the first one for the header
            // or we just return the list.

            const fullOrder = {
                ...order,
                event_name: itemsResult.length > 0 ? itemsResult[0].event_name : "Unknown Event",
                event_slug: itemsResult.length > 0 ? itemsResult[0].event_slug : "",
                banner_url: itemsResult.length > 0 ? itemsResult[0].banner_url : "",
                banner_url: itemsResult.length > 0 ? itemsResult[0].banner_url : "",
                items: itemsWithPlanes
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
