const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('debug_sql', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug_sql',
    handler: async (request, context) => {
        try {
            const intType = sql.Int ? "Defined" : "Undefined";

            // Test 1: Simple Select
            const simple = await query("SELECT 1 as val");

            // Test 2: Param Select
            const param = await query("SELECT @val as val", [{ name: 'val', type: sql.Int, value: 123 }]);

            return {
                status: 200,
                jsonBody: {
                    sql_Int_Status: intType,
                    simple_result: simple,
                    param_result: param
                }
            };
        } catch (error) {
            return { status: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
        }
    }
});
