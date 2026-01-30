const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('getAssetAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'assets/availability',
    handler: async (request, context) => {
        const typeId = request.query.get('typeId');
        const start = request.query.get('start');
        const end = request.query.get('end');

        if (!typeId || !start || !end) {
            return { status: 400, body: JSON.stringify({ error: "Missing typeId, start, or end date" }) };
        }

        try {
            const pool = await getPool();

            // Logic: 
            // 1. Get Stock Quantity for this Asset Type
            // 2. Count number of ACTIVE hires for this Type that overlap the requested dates.
            // 3. Available = Stock - Booked

            // Overlap: (StartA <= EndB) and (EndA >= StartB)

            const query = `
                WITH AssetStock AS (
                    SELECT stock_quantity
                    FROM asset_types
                    WHERE asset_type_id = @typeId
                ),
                BookedCount AS (
                    SELECT COUNT(*) as booked_count
                    FROM asset_hires ah
                    WHERE ah.asset_type_id = @typeId
                    AND (
                        ah.hire_start_date <= @end 
                        AND ah.hire_end_date >= @start
                    )
                )
                SELECT 
                    s.stock_quantity,
                    b.booked_count,
                    (s.stock_quantity - b.booked_count) as available_count
                FROM AssetStock s, BookedCount b
            `;

            const result = await pool.request()
                .input('typeId', sql.Int, typeId)
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(query);

            if (result.recordset.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Asset Type not found" }) };
            }

            const { stock_quantity, booked_count, available_count } = result.recordset[0];
            const isAvailable = available_count > 0;

            // Return array of "Ghost" items if available, or empty?
            // Frontend expects an array of items to pick from?
            // Re-factor Frontend to just see "Available Count".
            // But for backward compatibility or easy modal switch, 
            // let's return a "Virtual Item" if available, or simple status.

            // New Frontend Logic expects: { available: true, count: 5 }
            // BUT Old Frontend expected [item1, item2].
            // To ensure safety, we return a structured response.

            return {
                status: 200,
                jsonBody: [{
                    asset_type_id: typeId,
                    available_count: Math.max(0, available_count),
                    stock_quantity,
                    booked_count,
                    // Mock fields for legacy frontend compatibility (until updated)
                    asset_item_id: -1,
                    identifier: `Available: ${Math.max(0, available_count)}`,
                    status: 'Active'
                }]
            };

        } catch (error) {
            context.error('Error checking availability:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
