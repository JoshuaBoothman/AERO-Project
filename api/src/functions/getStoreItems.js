const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('getStoreItems', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // AUTH CHECK
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized. Please login." }) };
        }

        const eventIdParam = request.query.get('eventId');
        const slug = request.query.get('slug');

        if (!eventIdParam && !slug) {
            return { status: 400, body: JSON.stringify({ error: "Missing eventId or slug" }) };
        }

        try {
            const pool = await getPool();

            // 1. Resolve Event ID & Name
            let eventId = eventIdParam;
            let eventName = '';
            let eventStartDate = null;
            let eventEndDate = null;

            if (slug && !eventId) {
                const eRes = await pool.request()
                    .input('slug', sql.NVarChar, slug)
                    .query("SELECT event_id, name, start_date, end_date FROM events WHERE slug = @slug");
                if (eRes.recordset.length === 0) return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
                eventId = eRes.recordset[0].event_id;
                eventName = eRes.recordset[0].name;
                eventStartDate = eRes.recordset[0].start_date;
                eventEndDate = eRes.recordset[0].end_date;
            } else if (eventId) {
                const eRes = await pool.request()
                    .input('eid', sql.Int, eventId)
                    .query("SELECT name, start_date, end_date FROM events WHERE event_id = @eid");
                if (eRes.recordset.length > 0) {
                    eventName = eRes.recordset[0].name;
                    eventStartDate = eRes.recordset[0].start_date;
                    eventEndDate = eRes.recordset[0].end_date;
                }
            }

            // 2. CHECK ATTENDEE STATUS
            // Does this user have a Ticket for this event?
            // We check the 'attendees' table joining 'persons' on user_id
            let isAttendee = false;
            const attCheck = await pool.request()
                .input('eid', sql.Int, eventId)
                .input('uid', sql.Int, user.userId)
                .query(`
                    SELECT TOP 1 a.attendee_id 
                    FROM attendees a
                    JOIN persons p ON a.person_id = p.person_id
                    JOIN event_ticket_types tt ON a.ticket_type_id = tt.ticket_type_id
                    WHERE a.event_id = @eid 
                    AND p.user_id = @uid
                    AND a.status IN ('Registered', 'CheckedIn')
                    AND tt.price > 0 -- Ensure it's a real ticket, or maybe just any ticket? Assuming 'Registration' is a ticket.
                `);

            if (attCheck.recordset.length > 0) {
                isAttendee = true;
            }

            // 3. Fetch Merch (Global Products)
            // Fetch all active products and their active SKUs
            const merchQuery = `
                SELECT 
                    ps.product_sku_id as sku_id, ps.price, ps.sku_code, ps.current_stock, ps.image_url as sku_image,
                    p.product_id, p.name as product_name, p.base_image_url, p.description, p.sort_order,
                    v.name as variant_category, vo.value as variant_value
                FROM product_skus ps
                JOIN products p ON ps.product_id = p.product_id
                LEFT JOIN sku_option_links sol ON ps.product_sku_id = sol.product_sku_id
                LEFT JOIN variant_options vo ON sol.variant_option_id = vo.variant_option_id
                LEFT JOIN variants var ON vo.variant_id = var.variant_id
                LEFT JOIN variant_categories v ON var.variant_category_id = v.variant_category_id
                WHERE ps.is_active = 1 AND p.is_active = 1
                ORDER BY p.sort_order ASC, p.name ASC
            `;
            const merchRes = await pool.request().query(merchQuery);

            // Group by Product
            const merchandise = [];
            const productMap = new Map();

            merchRes.recordset.forEach(row => {
                let prod = productMap.get(row.product_id);
                if (!prod) {
                    prod = {
                        id: row.product_id,
                        name: row.product_name,
                        description: row.description,
                        image: row.base_image_url,
                        sortOrder: row.sort_order || 0,
                        options: [], // [{ name: "Color", values: Set() }]
                        skus: []
                    };
                    productMap.set(row.product_id, prod);
                    merchandise.push(prod);
                }

                // Find or Create SKU
                let existingSku = prod.skus.find(s => s.id === row.sku_id);
                if (!existingSku) {
                    existingSku = {
                        id: row.sku_id, // product_sku_id
                        code: row.sku_code,
                        price: row.price,
                        stock: row.current_stock,
                        image: row.sku_image || null, // SKU specific image
                        variant_map: {} // { "Color": "Red", "Size": "L" }
                    };
                    prod.skus.push(existingSku);
                }

                // Process Variant Option
                if (row.variant_category && row.variant_value) {
                    // Add to SKU's map
                    existingSku.variant_map[row.variant_category] = row.variant_value;

                    // Add to Product's centralized Option Definitions
                    let optCat = prod.options.find(o => o.name === row.variant_category);
                    if (!optCat) {
                        optCat = { name: row.variant_category, values: new Set() };
                        prod.options.push(optCat);
                    }
                    optCat.values.add(row.variant_value);
                }
            });

            // Post-process options to convert Sets to Arrays
            merchandise.forEach(prod => {
                prod.options.forEach(opt => {
                    opt.values = Array.from(opt.values).sort();
                });
            });

            // Explicit JS Sort to be safe
            merchandise.sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                }
                return a.name.localeCompare(b.name);
            });


            // 4. Fetch Assets
            const assetRes = await pool.request().input('eid', sql.Int, eventId).query(`
                SELECT asset_type_id, name, description, base_hire_cost, full_event_cost, ISNULL(show_daily_cost, 1) as show_daily_cost, ISNULL(show_full_event_cost, 0) as show_full_event_cost, image_url
                FROM asset_types
                WHERE event_id = @eid
            `);
            const assets = assetRes.recordset.map(a => ({
                id: a.asset_type_id,
                name: a.name,
                description: a.description,
                price: a.base_hire_cost,
                base_hire_cost: a.base_hire_cost, // Explicit for Modal
                full_event_cost: a.full_event_cost,
                show_daily_cost: a.show_daily_cost,
                show_full_event_cost: a.show_full_event_cost,
                image: a.image_url
            }));

            // 5. Fetch Subevents
            const subRes = await pool.request().input('eid', sql.Int, eventId).query(`
                SELECT subevent_id, name, description, start_time, end_time, capacity, cost
                FROM subevents
                WHERE event_id = @eid
            `);
            const subevents = subRes.recordset.map(s => ({
                id: s.subevent_id,
                name: s.name,
                description: s.description,
                startTime: s.start_time,
                endTime: s.end_time,
                price: s.cost,
                capacity: s.capacity
            }));

            // 6. Fetch Ticket Types (NEW)
            const ticketRes = await pool.request().input('eid', sql.Int, eventId).query(`
                SELECT ticket_type_id, name, description, price, system_role
                FROM event_ticket_types
                WHERE event_id = @eid
                ORDER BY sort_order ASC, price ASC
            `);
            const tickets = ticketRes.recordset.map(t => ({
                id: t.ticket_type_id,
                name: t.name,
                description: t.description,
                price: t.price,
                name: t.name,
                description: t.description,
                price: t.price,
                system_role: t.system_role
            }));

            return {
                status: 200,
                body: JSON.stringify({
                    eventId,
                    eventName,
                    eventStartDate,
                    eventEndDate,
                    isAttendee,
                    merchandise,
                    assets,
                    subevents,
                    tickets // <--- Added Tickets
                })
            };

        } catch (err) {
            context.log(err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});
