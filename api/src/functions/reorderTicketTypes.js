const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('reorderTicketTypes', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/ticket-types/reorder',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Expecting array of { ticket_type_id, sort_order }
            const { sortedTickets } = await request.json();

            if (!Array.isArray(sortedTickets) || sortedTickets.length === 0) {
                return { status: 400, body: JSON.stringify({ error: "Invalid payload. Expected array 'sortedTickets'." }) };
            }

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);

            try {
                await transaction.begin();

                for (const ticket of sortedTickets) {
                    const { ticket_type_id, sort_order } = ticket;

                    const request = new sql.Request(transaction);
                    request.input('id', sql.Int, ticket_type_id);
                    request.input('order', sql.Int, sort_order);
                    request.input('eventId', sql.Int, eventId);

                    // Ensure we only update tickets belonging to this event for safety
                    await request.query(`
                        UPDATE event_ticket_types 
                        SET sort_order = @order 
                        WHERE ticket_type_id = @id AND event_id = @eventId
                    `);
                }

                await transaction.commit();
                return { status: 200, body: JSON.stringify({ message: "Reorder successful" }) };

            } catch (txError) {
                await transaction.rollback();
                throw txError;
            }

        } catch (error) {
            context.log.error(`Error reordering tickets: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
