const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createVenue', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'venues',
    handler: async (request, context) => {
        try {
            // 1. Auth Check
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            // 2. Parse Body
            const { name, address_line_1, city, state, postcode, map_url } = await request.json();

            if (!name || !state) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields (name, state)" }) };
            }

            // Map State to Timezone
            const timezones = {
                'QLD': 'Australia/Brisbane',
                'NSW': 'Australia/Sydney',
                'VIC': 'Australia/Melbourne',
                'ACT': 'Australia/Sydney',
                'TAS': 'Australia/Hobart',
                'SA': 'Australia/Adelaide',
                'WA': 'Australia/Perth',
                'NT': 'Australia/Darwin'
            };
            const timezone = timezones[state] || 'Australia/Brisbane';

            // 3. Insert
            const insertQuery = `
                INSERT INTO venues (name, address_line_1, city, state, postcode, map_url, timezone)
                OUTPUT INSERTED.venue_id, INSERTED.name, INSERTED.city, INSERTED.state
                VALUES (@name, @address, @city, @state, @postcode, @mapUrl, @timezone)
            `;

            const result = await query(insertQuery, [
                { name: 'name', type: sql.NVarChar, value: name },
                { name: 'address', type: sql.NVarChar, value: address_line_1 || '' },
                { name: 'city', type: sql.NVarChar, value: city || '' },
                { name: 'state', type: sql.NVarChar, value: state },
                { name: 'postcode', type: sql.NVarChar, value: postcode || '' },
                { name: 'mapUrl', type: sql.NVarChar, value: map_url || null },
                { name: 'timezone', type: sql.NVarChar, value: timezone }
            ]);

            return {
                status: 201,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error creating venue: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
        }
    }
});
