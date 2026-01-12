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

            // Logic: Select items of this Type that are Active,
            // AND are NOT in the list of hired items that overlap with the requested dates.
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)

            const query = `
                SELECT 
                    ai.asset_item_id, 
                    ai.identifier, 
                    ai.serial_number, 
                    ai.notes, 
                    ai.image_url,
                    ai.status
                FROM asset_items ai
                WHERE ai.asset_type_id = @typeId 
                AND ai.status = 'Active'
                AND ai.asset_item_id NOT IN (
                    SELECT ah.asset_item_id
                    FROM asset_hires ah
                    WHERE 
                    (
                        ah.hire_start_date <= @end 
                        AND ah.hire_end_date >= @start
                    )
                    -- Assuming all hire records found here are valid bookings
                )
            `;

            const result = await pool.request()
                .input('typeId', sql.Int, typeId)
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(query);

            return { status: 200, jsonBody: result.recordset };

        } catch (error) {
            context.error('Error checking availability:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
