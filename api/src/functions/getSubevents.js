const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');

app.http('getSubevents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/subevents',
    handler: async (request, context) => {
        const { eventId } = request.params;
        try {
            const selectQuery = `
                SELECT * FROM subevents 
                WHERE event_id = @eventId
                ORDER BY start_time ASC
            `;

            const result = await query(selectQuery, [
                { name: 'eventId', type: sql.Int, value: eventId }
            ]);

            return {
                status: 200,
                jsonBody: result
            };

        } catch (error) {
            context.error(`Error fetching subevents: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
