const { app } = require('@azure/functions');
const { getPool } = require('../lib/db');

app.http('setupTest', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await getPool();

            // 1. Get the first ticket type for the first public event
            const result = await pool.request().query(`
                SELECT TOP 1 ticket_type_id, name, event_id 
                FROM event_ticket_types 
                ORDER BY ticket_type_id
            `);

            if (result.recordset.length === 0) return { body: "No tickets found." };

            const ticket = result.recordset[0];

            // 2. Update it to be a PILOT ticket
            await pool.request()
                .input('tid', ticket.ticket_type_id)
                .query("UPDATE event_ticket_types SET is_pilot = 1, system_role = 'pilot' WHERE ticket_type_id = @tid");

            return { body: `Updated ticket '${ticket.name}' (ID: ${ticket.ticket_type_id}) to be is_pilot=1.` };
        } catch (error) {
            return { status: 500, body: "Error: " + error.message };
        }
    }
});
