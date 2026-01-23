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
                        WHEN oi.item_type = 'Campsite' THEN CONCAT('Campsite: ', c.site_number)
                        WHEN oi.item_type = 'Subevent' THEN se.name
                        WHEN oi.item_type = 'Asset' THEN at.name
                        ELSE ett.name 
                    END as item_name,
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
                    a.ticket_type_id,
                    a.is_heavy_model_inspector,
                    e.name as event_name,
                    e.slug as event_slug,
                    e.banner_url,
                    -- Extra Fields for Merch
                    sku.sku_code,
                    -- Extra Fields for Campsites
                    c.campsite_id,
                    cb.check_in_date as camp_check_in,
                    cb.check_out_date as camp_check_out,
                    -- Extra Fields for Assets
                    ai.identifier as asset_identifier,
                    ah.hire_start_date as asset_start,
                    ah.hire_end_date as asset_end,
                    -- Extra Fields for Subevents
                    se.start_time as subevent_start
                FROM order_items oi
                JOIN attendees a ON oi.attendee_id = a.attendee_id
                JOIN event_ticket_types ett ON a.ticket_type_id = ett.ticket_type_id
                JOIN persons p ON a.person_id = p.person_id
                JOIN events e ON a.event_id = e.event_id
                LEFT JOIN product_skus sku ON oi.item_reference_id = sku.product_sku_id AND oi.item_type = 'Merchandise'
                LEFT JOIN products p_prod ON sku.product_id = p_prod.product_id
                LEFT JOIN campsites c ON oi.item_reference_id = c.campsite_id AND oi.item_type = 'Campsite'
                LEFT JOIN campsite_bookings cb ON cb.order_item_id = oi.order_item_id
                LEFT JOIN subevents se ON oi.item_reference_id = se.subevent_id AND oi.item_type = 'Subevent'
                LEFT JOIN asset_items ai ON oi.item_reference_id = ai.asset_item_id AND oi.item_type = 'Asset'
                LEFT JOIN asset_types at ON ai.asset_type_id = at.asset_type_id
                LEFT JOIN asset_hires ah ON ah.order_item_id = oi.order_item_id
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
                items: itemsWithPlanes
            };

            return {
                status: 200,
                body: JSON.stringify(fullOrder)
            };

        } catch (error) {
            context.log(`Error in getOrderDetail: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
