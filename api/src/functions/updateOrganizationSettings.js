const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateOrganizationSettings', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'organization/settings', // RESTful: PUT /api/organization/settings
    handler: async (request, context) => {
        try {
            // 1. Auth Check - Admins only
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
            }

            const { organization_name, support_email, primary_color, secondary_color, accent_color, logo_url } = await request.json();

            // 2. Update logic
            // Since it's a singleton row, we update the single row where ID is usually 1, or just update TOP 1. 
            // Better to assume we are updating the existing row. 
            // In many singleton config tables, we might just UPDATE ALL users or strict ID=1.
            // Let's assume there's only one row.

            const updateQuery = `
                UPDATE organization_settings
                SET 
                    organization_name = @org_name,
                    support_email = @email,
                    primary_color = @primary,
                    secondary_color = @secondary,
                    accent_color = @accent,
                    logo_url = @logo
                OUTPUT INSERTED.*
            `;

            const result = await query(updateQuery, [
                { name: 'org_name', type: sql.NVarChar, value: organization_name },
                { name: 'email', type: sql.NVarChar, value: support_email },
                { name: 'primary', type: sql.NVarChar, value: primary_color },
                { name: 'secondary', type: sql.NVarChar, value: secondary_color },
                { name: 'accent', type: sql.NVarChar, value: accent_color },
                { name: 'logo', type: sql.NVarChar, value: logo_url }
            ]);

            if (result.length === 0) {
                // Try inserting if it doesn't exist? (Optional, but good for robustness)
                // For now, assume it exists as per getOrganization.
                return { status: 404, body: JSON.stringify({ error: "Organization settings not found to update." }) };
            }

            return {
                status: 200,
                jsonBody: result[0]
            };

        } catch (error) {
            context.error(`Error updating organization settings: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
