const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateEvent', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'events/{eventId}',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;

            // 1. Auth Check
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { name, description, start_date, end_date, venue_id, banner_url, status, is_purchasing_enabled, is_public_viewable, mop_url, dinner_date } = await request.json();

            // 3. Update Query
            // Note: We are NOT updating the slug to preserve URLs.
            const updateQuery = `
                UPDATE events
                SET 
                    name = @name,
                    description = @description,
                    start_date = @start_date,
                    end_date = @end_date,
                    venue_id = @venue_id,
                    banner_url = @banner_url,
                    status = @status,
                    is_purchasing_enabled = @is_purchasing_enabled,
                    is_public_viewable = @is_public_viewable,
                    mop_url = @mop_url,
                    dinner_date = @dinner_date
                WHERE event_id = @eventId
            `;

            await query(updateQuery, [
                { name: 'eventId', type: sql.Int, value: eventId },
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'description', type: sql.NVarChar, value: description || '' },
                { name: 'start_date', type: sql.DateTime, value: start_date },
                { name: 'end_date', type: sql.DateTime, value: end_date },
                { name: 'venue_id', type: sql.Int, value: venue_id },
                { name: 'banner_url', type: sql.NVarChar, value: banner_url || null },
                { name: 'status', type: sql.NVarChar, value: status },
                { name: 'is_purchasing_enabled', type: sql.Bit, value: is_purchasing_enabled ? 1 : 0 },
                { name: 'is_public_viewable', type: sql.Bit, value: is_public_viewable ? 1 : 0 },
                { name: 'mop_url', type: sql.NVarChar, value: mop_url || null },
                { name: 'dinner_date', type: sql.DateTime, value: dinner_date || null }
            ]);

            return {
                status: 200,
                jsonBody: { message: "Event updated successfully" }
            };

        } catch (error) {
            context.error(`Error updating event: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
