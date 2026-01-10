const { app } = require('@azure/functions');
const { query } = require('../lib/db');

app.http('getVenues', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'venues',
    handler: async (request, context) => {
        try {
            const venues = await query("SELECT venue_id, name, city, state FROM venues ORDER BY name ASC");
            return {
                status: 200,
                jsonBody: venues
            };
        } catch (error) {
            context.log.error(`Error fetching venues: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
