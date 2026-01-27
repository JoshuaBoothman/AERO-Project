const { app } = require('@azure/functions');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

// GET Ticket Types for an Event
app.http('getTicketTypes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/ticket-types',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            // Optional: Auth check, or public if anyone can see ticket types? 
            // Usually admins need to see all details, public might see only available.
            // For now, let's assume this is the admin endpoint matching the request context.
            // If strictly admin:
            const user = validateToken(request);
            if (!user) { // || user.role !== 'admin' (Allow other roles if needed, or check logic)
                // For now, allow logged in users or public? 
                // Assuming admin facing for edit page:
                // But wait, the public purchase page will also need this. 
                // Let's keep it open or check token if provided.
                // For safety context in `EventForm` uses token.
                // Let's just validate token if present, but since it's GET, maybe public needs it too?
                // The routes are usually protected by logic in frontend or explicit checks.
                // Let's look at `getEvents` usually.
            }

            const q = `
                SELECT ticket_type_id, event_id, name, price, system_role, description, sort_order, includes_merch, price_no_flight_line, is_day_pass, includes_official_dinner
                FROM event_ticket_types 
                WHERE event_id = @eventId
                ORDER BY sort_order ASC, price ASC
            `;
            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            // Fetch Linked Products
            const linksQ = `
                SELECT tlp.ticket_type_id, tlp.product_id
                FROM ticket_linked_products tlp
                JOIN event_ticket_types ett ON tlp.ticket_type_id = ett.ticket_type_id
                WHERE ett.event_id = @eventId
            `;
            const linksResult = await query(linksQ, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            const types = result.map(t => ({
                ...t,
                linkedProductIds: linksResult.filter(l => l.ticket_type_id === t.ticket_type_id).map(l => l.product_id)
            }));

            return { jsonBody: types };
        } catch (error) {
            context.error(`Error getting ticket types: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// CREATE Ticket Type
app.http('createTicketType', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/ticket-types',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { name, price, system_role, description, includes_merch, linkedProductIds, price_no_flight_line, is_day_pass, includes_official_dinner } = await request.json();

            if (!name || price === undefined || !system_role) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields" }) };
            }

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Auto-assign next sort_order
                const insertQ = `
                    DECLARE @NextOrder INT;
                    SELECT @NextOrder = ISNULL(MAX(sort_order), 0) + 1 FROM event_ticket_types WHERE event_id = @eventId;

                    INSERT INTO event_ticket_types (event_id, name, price, system_role, description, sort_order, includes_merch, price_no_flight_line, is_day_pass, includes_official_dinner)
                    OUTPUT INSERTED.*
                    VALUES (@eventId, @name, @price, @system_role, @description, @NextOrder, @includesMerch, @priceNoFlightLine, @isDayPass, @includesOfficialDinner)
                `;

                const req = new sql.Request(transaction);
                const result = await req
                    .input('eventId', sql.Int, eventId)
                    .input('name', sql.NVarChar, name)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('system_role', sql.VarChar, system_role)
                    .input('description', sql.NVarChar, description || null)
                    .input('includesMerch', sql.Bit, includes_merch ? 1 : 0)
                    .input('priceNoFlightLine', sql.Decimal(10, 2), price_no_flight_line || null)
                    .input('isDayPass', sql.Bit, is_day_pass ? 1 : 0)
                    .input('includesOfficialDinner', sql.Bit, includes_official_dinner ? 1 : 0)
                    .query(insertQ);

                const newTicket = result.recordset[0];
                const ticketTypeId = newTicket.ticket_type_id;

                // Insert Linked Products
                if (linkedProductIds && Array.isArray(linkedProductIds) && linkedProductIds.length > 0) {
                    for (const pid of linkedProductIds) {
                        const linkReq = new sql.Request(transaction);
                        await linkReq
                            .input('ttid', sql.Int, ticketTypeId)
                            .input('pid', sql.Int, pid)
                            .query(`INSERT INTO ticket_linked_products (ticket_type_id, product_id) VALUES (@ttid, @pid)`);
                    }
                }

                await transaction.commit();

                // Return with IDs
                newTicket.linkedProductIds = linkedProductIds || [];
                return { status: 201, jsonBody: newTicket };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            context.error(`Error creating ticket type: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// UPDATE Ticket Type
app.http('updateTicketType', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'ticket-types/{ticketTypeId}',
    handler: async (request, context) => {
        try {
            const { ticketTypeId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { name, price, system_role, description, includes_merch, linkedProductIds, price_no_flight_line, is_day_pass, includes_official_dinner } = await request.json();

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const updateQ = `
                    UPDATE event_ticket_types
                    SET name = @name, price = @price, system_role = @system_role, 
                        description = @description, includes_merch = @includesMerch,
                        price_no_flight_line = @priceNoFlightLine, is_day_pass = @isDayPass,
                        includes_official_dinner = @includesOfficialDinner
                    OUTPUT INSERTED.*
                    WHERE ticket_type_id = @ticketTypeId
                `;

                const req = new sql.Request(transaction);
                const result = await req
                    .input('ticketTypeId', sql.Int, ticketTypeId)
                    .input('name', sql.NVarChar, name)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('system_role', sql.VarChar, system_role)
                    .input('description', sql.NVarChar, description || null)
                    .input('includesMerch', sql.Bit, includes_merch ? 1 : 0)
                    .input('priceNoFlightLine', sql.Decimal(10, 2), price_no_flight_line || null)
                    .input('isDayPass', sql.Bit, is_day_pass ? 1 : 0)
                    .input('includesOfficialDinner', sql.Bit, includes_official_dinner ? 1 : 0)
                    .query(updateQ);

                if (result.recordset.length === 0) {
                    await transaction.rollback();
                    return { status: 404, body: JSON.stringify({ error: "Ticket Type not found" }) };
                }
                const updatedTicket = result.recordset[0];

                // Update Links: Delete all and re-insert
                const delReq = new sql.Request(transaction);
                await delReq.input('ttid', sql.Int, ticketTypeId).query(`DELETE FROM ticket_linked_products WHERE ticket_type_id = @ttid`);

                if (includes_merch && linkedProductIds && Array.isArray(linkedProductIds) && linkedProductIds.length > 0) {
                    for (const pid of linkedProductIds) {
                        const linkReq = new sql.Request(transaction);
                        await linkReq
                            .input('ttid', sql.Int, ticketTypeId)
                            .input('pid', sql.Int, pid)
                            .query(`INSERT INTO ticket_linked_products (ticket_type_id, product_id) VALUES (@ttid, @pid)`);
                    }
                }

                await transaction.commit();

                updatedTicket.linkedProductIds = linkedProductIds || [];
                return { jsonBody: updatedTicket };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            context.error(`Error updating ticket type: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// DELETE Ticket Type
app.http('deleteTicketType', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'ticket-types/{ticketTypeId}',
    handler: async (request, context) => {
        try {
            const { ticketTypeId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Check if used in attendees? Constraint might fail if so.
            // Ideally we check first or let DB error handle it.
            // But strict FKs might prevent deletion.

            const q = `DELETE FROM event_ticket_types WHERE ticket_type_id = @ticketTypeId`;
            await query(q, [{ name: 'ticketTypeId', type: sql.Int, value: ticketTypeId }]);

            return { status: 204 };
        } catch (error) {
            context.error(`Error deleting ticket type: ${error.message}`);
            if (error.message.includes('REFERENCE constraint')) {
                return { status: 409, body: JSON.stringify({ error: "Cannot delete ticket type because it has associated attendees." }) };
            }
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
