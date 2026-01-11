const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
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
                SELECT * FROM event_ticket_types 
                WHERE event_id = @eventId
                ORDER BY price ASC
            `;
            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            return { jsonBody: result };
        } catch (error) {
            context.log.error(`Error getting ticket types: ${error.message}`);
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

            const { name, price, system_role, is_pilot, is_pit_crew } = await request.json();

            if (!name || price === undefined || !system_role) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields" }) };
            }

            const insertQ = `
                INSERT INTO event_ticket_types (event_id, name, price, system_role, is_pilot, is_pit_crew)
                OUTPUT INSERTED.*
                VALUES (@eventId, @name, @price, @system_role, @isPilot, @isPitCrew)
            `;

            const result = await query(insertQ, [
                { name: 'eventId', type: sql.Int, value: eventId },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'price', type: sql.Decimal(10, 2), value: price },
                { name: 'system_role', type: sql.VarChar, value: system_role },
                { name: 'isPilot', type: sql.Bit, value: is_pilot ? 1 : 0 },
                { name: 'isPitCrew', type: sql.Bit, value: is_pit_crew ? 1 : 0 }
            ]);

            return { status: 201, jsonBody: result[0] };
        } catch (error) {
            context.log.error(`Error creating ticket type: ${error.message}`);
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

            const { name, price, system_role, is_pilot, is_pit_crew } = await request.json();

            const updateQ = `
                UPDATE event_ticket_types
                SET name = @name, price = @price, system_role = @system_role, 
                    is_pilot = @isPilot, is_pit_crew = @isPitCrew
                OUTPUT INSERTED.*
                WHERE ticket_type_id = @ticketTypeId
            `;

            const result = await query(updateQ, [
                { name: 'ticketTypeId', type: sql.Int, value: ticketTypeId },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'price', type: sql.Decimal(10, 2), value: price },
                { name: 'system_role', type: sql.VarChar, value: system_role },
                { name: 'isPilot', type: sql.Bit, value: is_pilot ? 1 : 0 },
                { name: 'isPitCrew', type: sql.Bit, value: is_pit_crew ? 1 : 0 }
            ]);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Ticket Type not found" }) };
            }

            return { jsonBody: result[0] };
        } catch (error) {
            context.log.error(`Error updating ticket type: ${error.message}`);
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
            context.log.error(`Error deleting ticket type: ${error.message}`);
            if (error.message.includes('REFERENCE constraint')) {
                return { status: 409, body: JSON.stringify({ error: "Cannot delete ticket type because it has associated attendees." }) };
            }
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
