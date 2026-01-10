const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('debug_schema', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug_schema',
    handler: async (request, context) => {
        try {
            const table = request.query.get('table') || 'campsites';
            const columns = await query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = @table
            `, [{ name: 'table', type: sql.NVarChar, value: table }]);

            return {
                status: 200,
                jsonBody: {
                    table: table,
                    columns: columns
                }
            };
        } catch (error) {
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
