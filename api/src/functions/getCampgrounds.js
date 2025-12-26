const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('getCampgrounds', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'campgrounds',
    handler: async (request, context) => {
        try {
            const result = await query("SELECT * FROM campgrounds");
            return {
                status: 200,
                jsonBody: result
            };
        } catch (error) {
            context.log.error('Error fetching campgrounds:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
