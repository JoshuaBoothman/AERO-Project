const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createSubevent', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'subevents',
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { event_id, name, description, start_time, end_time, capacity, cost, img_url } = await request.json();

            if (!event_id || !name || !start_time || !end_time) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields (event_id, name, dates)" }) };
            }

            // 3. Insert
            const insertQuery = `
                INSERT INTO subevents (
                    event_id, name, description, start_time, end_time, capacity, cost, img_url
                )
                OUTPUT INSERTED.*
                VALUES (
                    @event_id, @name, @description, @start_time, @end_time, @capacity, @cost, @img_url
                )
            `;

            const result = await query(insertQuery, [
                { name: 'event_id', type: sql.Int, value: event_id },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'description', type: sql.NVarChar, value: description || null },
                { name: 'start_time', type: sql.DateTime2, value: start_time },
                { name: 'end_time', type: sql.DateTime2, value: end_time },
                { name: 'capacity', type: sql.Int, value: capacity || null },
                { name: 'cost', type: sql.Decimal(10, 2), value: cost || 0 },
                { name: 'img_url', type: sql.NVarChar, value: img_url || null }
            ]);

            return {
                status: 201,
                jsonBody: {
                    message: "Subevent created successfully",
                    subevent: result[0]
                }
            };

        } catch (error) {
            context.error(`Error creating subevent: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
