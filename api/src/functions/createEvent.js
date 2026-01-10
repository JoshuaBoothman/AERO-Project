const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createEvent', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'events',
    handler: async (request, context) => {
        try {
            // 1. Auth Check
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { name, description, start_date, end_date, venue_id, banner_url, status, is_purchasing_enabled, is_public_viewable } = await request.json();

            if (!name || !start_date || !end_date || !venue_id) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields (name, dates, venue)" }) };
            }

            // 3. Generate Slug and Check Uniqueness
            let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            // Simple check for uniqueness could be improved, but relying on DB constraint or simple retry if needed.
            // For now, let's append a random string if it looks like it might conflict? Or just let standard slugify happen.
            // We'll trust the user to provide a unique name or we catch the error.

            // 4. Insert
            const insertQuery = `
                INSERT INTO events (
                    name, slug, description, start_date, end_date, venue_id, 
                    banner_url, status, is_purchasing_enabled, is_public_viewable
                )
                OUTPUT INSERTED.event_id, INSERTED.slug
                VALUES (
                    @name, @slug, @description, @start_date, @end_date, @venue_id, 
                    @banner_url, @status, @is_purchasing_enabled, @is_public_viewable
                )
            `;

            const result = await query(insertQuery, [
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'slug', type: sql.NVarChar, value: slug },
                { name: 'description', type: sql.NVarChar, value: description || '' },
                { name: 'start_date', type: sql.DateTime, value: start_date },
                { name: 'end_date', type: sql.DateTime, value: end_date },
                { name: 'venue_id', type: sql.Int, value: venue_id },
                { name: 'banner_url', type: sql.NVarChar, value: banner_url || null },
                { name: 'status', type: sql.NVarChar, value: status || 'Draft' }, // Default to Draft
                { name: 'is_purchasing_enabled', type: sql.Bit, value: is_purchasing_enabled ? 1 : 0 },
                { name: 'is_public_viewable', type: sql.Bit, value: is_public_viewable ? 1 : 0 }
            ]);

            return {
                status: 201,
                jsonBody: {
                    message: "Event created successfully",
                    event: result[0]
                }
            };

        } catch (error) {
            context.log.error(`Error creating event: ${error.message}`);
            // Check for duplicate slug error (SQL Server usually throws error 2601 or 2627)
            if (error.message.includes('unique index') || error.message.includes('duplicate key')) {
                return { status: 409, body: JSON.stringify({ error: "Event name/slug already exists. Please choose a different name." }) };
            }
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
