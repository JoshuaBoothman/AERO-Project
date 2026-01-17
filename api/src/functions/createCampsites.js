const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('createCampsites', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'campgrounds/{id}/sites',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const campgroundId = request.params.id;
        const body = await request.json();
        const { count, prefix, price, full_event_price } = body;

        if (!count || count < 1) {
            return { status: 400, body: JSON.stringify({ error: "Invalid count" }) };
        }

        const sitePrefix = prefix || 'Site ';
        const sitePrice = parseFloat(price) || 0;
        const siteFullPrice = full_event_price ? parseFloat(full_event_price) : null;

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Get current highest site number to append correctly (optional, but good for "Site 1, Site 2" logic)
                // For simplicity, we might just append random or sequential logic, but let's assume the user handles naming via prefix + iteration.
                // Let's just create N sites. Use a simple loop for now or a bulk insert.

                if (Array.isArray(body.specific_names) && body.specific_names.length > 0) {
                    // Specific Names Mode
                    for (const name of body.specific_names) {
                        await transaction.request()
                            .input('cid', sql.Int, campgroundId)
                            .input('name', sql.NVarChar, name)
                            .input('price', sql.Decimal(10, 2), sitePrice)
                            .input('fprice', sql.Decimal(10, 2), siteFullPrice)
                            .query(`
                                INSERT INTO campsites (campground_id, site_number, is_active, is_powered, price_per_night, full_event_price)
                                VALUES (@cid, @name, 1, 0, @price, @fprice)
                            `);
                    }
                } else {
                    // Bulk Create Mode
                    // Get count of existing sites for this campground to start numbering
                    const countResult = await transaction.request()
                        .input('id', sql.Int, campgroundId)
                        .query("SELECT COUNT(*) as count FROM campsites WHERE campground_id = @id");

                    let startNum = countResult.recordset[0].count + 1;

                    for (let i = 0; i < count; i++) {
                        const siteName = `${sitePrefix}${startNum + i}`;
                        await transaction.request()
                            .input('cid', sql.Int, campgroundId)
                            .input('name', sql.NVarChar, siteName)
                            .input('price', sql.Decimal(10, 2), sitePrice)
                            .input('fprice', sql.Decimal(10, 2), siteFullPrice)
                            .query(`
                                INSERT INTO campsites (campground_id, site_number, is_active, is_powered, price_per_night, full_event_price)
                                VALUES (@cid, @name, 1, 0, @price, @fprice)
                            `);
                    }
                }

                await transaction.commit();

                return {
                    status: 201,
                    jsonBody: { message: `Successfully created ${count} campsites` }
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log.error(`Error creating sites for ${campgroundId}:`, error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
