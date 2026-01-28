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
                    o.invoice_number,
                    o.amount_paid,
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
            // 3. Fetch Items (Tickets/Attendees)
            // We join to get Event info, Ticket Type info, Person info
            // Use subqueries for Variants to avoid JOIN duplication
            const itemsQuery = `
                SELECT 
                    DISTINCT
                    oi.order_item_id,
                    oi.refunded_at,
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
                    a.dietary_requirements,
                    e.name as event_name,
                    e.slug as event_slug,
                    e.banner_url,
                    -- Extra Fields for Merch
                    sku.sku_code,
                    (
                        SELECT STRING_AGG(vc.name + ': ' + vo.value, ', ')
                        FROM sku_option_links sol
                        JOIN variant_options vo ON sol.variant_option_id = vo.variant_option_id
                        JOIN variants v ON vo.variant_id = v.variant_id
                        JOIN variant_categories vc ON v.variant_category_id = vc.variant_category_id
                        WHERE sol.product_sku_id = sku.product_sku_id
                    ) as variant_string,
                    -- Extra Fields for Campsites
                    c.campsite_id,
                    cb.check_in_date as camp_check_in,
                    cb.check_out_date as camp_check_out,
                    -- Extra Fields for Assets
                    ai.identifier as asset_identifier,
                    ah.hire_start_date as asset_start,
                    ah.hire_end_date as asset_end,
                    -- Extra Fields for Subevents
                    se.start_time as subevent_start,
                    (
                        SELECT STRING_AGG(svo.name, ', ')
                        FROM subevent_registration_choices src
                        JOIN subevent_registrations sr ON src.subevent_registration_id = sr.subevent_registration_id
                        JOIN subevent_variation_options svo ON src.variation_option_id = svo.variation_option_id
                        WHERE sr.order_item_id = oi.order_item_id
                    ) as subevent_options,
                    -- Subevent Attendee Name (Explicit lookup via registration)
                    (
                        SELECT TOP 1 p_sub.first_name + ' ' + p_sub.last_name
                        FROM subevent_registrations sr_sub
                        JOIN attendees a_sub ON sr_sub.attendee_id = a_sub.attendee_id
                        JOIN persons p_sub ON a_sub.person_id = p_sub.person_id
                        WHERE sr_sub.order_item_id = oi.order_item_id
                    ) as subevent_attendee_name,
                    -- Pilot Name (Linked or Direct)
                    CASE
                        WHEN a.pilot_name IS NOT NULL THEN a.pilot_name
                        WHEN a.linked_pilot_attendee_id IS NOT NULL THEN (
                            SELECT TOP 1 p2.first_name + ' ' + p2.last_name 
                            FROM attendees a2 
                            JOIN persons p2 ON a2.person_id = p2.person_id 
                            WHERE a2.attendee_id = a.linked_pilot_attendee_id
                        )
                        ELSE NULL
                    END as pilot_name
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
            const pilotPersonIds = [...new Set(itemsResult.filter(i => ['pilot', 'junior_pilot'].includes(i.system_role)).map(i => i.person_id))];
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

            // 3.6 Fetch Transactions
            const transQuery = `
                SELECT transaction_id, amount, payment_method, status, reference, payment_date, timestamp 
                FROM transactions 
                WHERE order_id = @oid 
                ORDER BY payment_date DESC, timestamp DESC
            `;
            const transResult = await query(transQuery, [{ name: 'oid', type: sql.Int, value: orderId }]);


            // 4. Construct Response
            // We'll attach the items to the order object
            // If there are multiple events (unlikely but possible), we pick the first one for the header
            // or we just return the list.

            const fullOrder = {
                ...order,
                event_name: itemsResult.length > 0 ? itemsResult[0].event_name : "Unknown Event",
                event_slug: itemsResult.length > 0 ? itemsResult[0].event_slug : "",
                banner_url: itemsResult.length > 0 ? itemsResult[0].banner_url : "",
                items: itemsWithPlanes,
                transactions: transResult
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
