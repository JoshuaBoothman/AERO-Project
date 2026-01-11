const { app } = require('@azure/functions');

app.http('temp_check', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return { body: "Hello World" };
    }
});
