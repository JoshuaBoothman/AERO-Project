const { app } = require('@azure/functions');
const { getPool } = require('../lib/db');

app.http('debugSchema', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-schema',
    handler: async (request, context) => {
        try {
            const pool = await getPool();

            // Allow checking specific table or all
            const tableName = request.query.get('table');

            let query = `
                SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
            `;

            if (tableName) {
                query += ` WHERE TABLE_NAME = '${tableName}'`;
            } else {
                // Just check critical tables
                query += ` WHERE TABLE_NAME IN ('admin_users', 'orders', 'order_items')`;
            }

            const result = await pool.request().query(query);

            // Group by table
            const schema = {};
            result.recordset.forEach(row => {
                if (!schema[row.TABLE_NAME]) schema[row.TABLE_NAME] = [];
                schema[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
            });

            return {
                status: 200,
                jsonBody: schema
            };

        } catch (error) {
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
