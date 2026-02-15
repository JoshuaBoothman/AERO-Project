const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');

app.http('debug_camp', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await getPool();
        const eventId = 9;

        try {
            // 1. Check Event
            const r1 = await pool.request()
                .input('eventId', sql.Int, eventId)
                .query('SELECT * FROM events WHERE event_id = @eventId');

            // 2. Check Campgrounds
            const r2 = await pool.request().query(`SELECT * FROM campgrounds WHERE event_id = ${eventId}`);

            // 3. Check Campsite columns
            const r3 = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campsite_bookings'`);

            return {
                status: 200,
                jsonBody: {
                    event: r1.recordset,
                    campgrounds: r2.recordset,
                    campsite_sample: r3.recordset
                }
            };

        } catch (e) {
            return {
                status: 500,
                body: JSON.stringify({ error: e.message, stack: e.stack })
            };
        }
    }
});
