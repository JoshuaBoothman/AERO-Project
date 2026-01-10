const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateSubevent', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'subevents/{id}',
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { name, description, start_time, end_time, capacity, cost, img_url } = await request.json();

            // 3. Update
            const updateQuery = `
                UPDATE subevents
                SET 
                    name = @name,
                    description = @description,
                    start_time = @start_time,
                    end_time = @end_time,
                    capacity = @capacity,
                    cost = @cost,
                    img_url = @img_url
                WHERE subevent_id = @id
            `;

            await query(updateQuery, [
                { name: 'id', type: sql.Int, value: id },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'description', type: sql.NVarChar, value: description || null },
                { name: 'start_time', type: sql.DateTime2, value: start_time },
                { name: 'end_time', type: sql.DateTime2, value: end_time },
                { name: 'capacity', type: sql.Int, value: capacity || null },
                { name: 'cost', type: sql.Decimal(10, 2), value: cost || 0 },
                { name: 'img_url', type: sql.NVarChar, value: img_url || null }
            ]);

            return {
                status: 200,
                jsonBody: { message: "Subevent updated successfully" }
            };

        } catch (error) {
            context.error(`Error updating subevent: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
