const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('getOrganization', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // We use TOP 1 because this table acts as a Singleton (only one row should exist)
            const query = "SELECT TOP 1 * FROM organization_settings";
            const result = await db.query(query);

            if (result.length === 0) {
                return {
                    status: 404,
                    body: JSON.stringify({ error: "Organization settings not found." })
                };
            }

            // Return the first (and only) row found
            return {
                status: 200,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error fetching organization settings: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});