const { app } = require('@azure/functions');
const { query } = require('../lib/db');

app.http('debug_subevents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug_subevents',
    handler: async (request, context) => {
        try {
            const result = await query("SELECT TOP 1 * FROM subevents");
            return {
                status: 200,
                jsonBody: {
                    columns: result.length > 0 ? Object.keys(result[0]) : "No rows found, cannot feel columns from data",
                    data: result
                }
            };
        } catch (error) {
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
