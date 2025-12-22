const { app } = require('@azure/functions');
const db = require('../lib/db');

app.http('testDb', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Simple query to get the database version
            const result = await db.query("SELECT @@VERSION as version");
            
            return { 
                body: JSON.stringify({ 
                    status: "Success", 
                    version: result[0].version 
                }) 
            };
        } catch (error) {
            return { 
                status: 500, 
                body: "Database connection failed: " + error.message 
            };
        }
    }
});