const { app } = require('@azure/functions');
const { sql, query } = require('../lib/db');

app.http('update_schema_force', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'update_schema_force',
    handler: async (request, context) => {
        try {
            // Drop existing table
            await query(`DROP TABLE IF EXISTS campsites`);

            // Recreate with correct schema from docs/schema.sql
            await query(`CREATE TABLE campsites (
                 campsite_id INT IDENTITY(1,1) PRIMARY KEY,
                 campground_id INT NOT NULL,
                 site_number NVARCHAR(50) NOT NULL,
                 is_powered BIT DEFAULT 0,
                 dimensions NVARCHAR(50),
                 map_coordinates NVARCHAR(50),
                 is_active BIT DEFAULT 1,
                 price_per_night DECIMAL(10, 2) DEFAULT 0.00
             )`);

            return {
                status: 200,
                jsonBody: { message: "Table campsites dropped and recreated successfully." }
            };
        } catch (error) {
            return { status: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
        }
    }
});
