const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('manageSubeventVariations', {
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    authLevel: 'anonymous',
    route: 'subevents/{id}/variations',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const subeventId = request.params.id;
        const method = request.method;

        try {
            const pool = await getPool();

            if (method === 'GET') {
                // Fetch Variations & Options
                const res = await pool.request().input('sid', sql.Int, subeventId).query(`
                    SELECT 
                        sv.subevent_variation_id, sv.name as variation_name, sv.is_required,
                        so.variation_option_id, so.name as option_name, so.price_adjustment
                    FROM subevent_variations sv
                    LEFT JOIN subevent_variation_options so ON sv.subevent_variation_id = so.subevent_variation_id
                    WHERE sv.subevent_id = @sid
                    ORDER BY sv.subevent_variation_id, so.variation_option_id
                `);

                const variations = [];
                const map = new Map();

                res.recordset.forEach(row => {
                    let v = map.get(row.subevent_variation_id);
                    if (!v) {
                        v = {
                            id: row.subevent_variation_id,
                            name: row.variation_name,
                            isRequired: row.is_required,
                            options: []
                        };
                        map.set(row.subevent_variation_id, v);
                        variations.push(v);
                    }
                    if (row.variation_option_id) {
                        v.options.push({
                            id: row.variation_option_id,
                            name: row.option_name,
                            priceAdjustment: row.price_adjustment
                        });
                    }
                });

                return { status: 200, body: JSON.stringify(variations) };
            }

            if (method === 'POST') {
                // Create Variation
                const { name, isRequired } = await request.json();
                if (!name) return { status: 400, body: JSON.stringify({ error: "Name is required" }) };

                // Insert
                await pool.request()
                    .input('sid', sql.Int, subeventId)
                    .input('name', sql.NVarChar, name)
                    .input('req', sql.Bit, isRequired ? 1 : 0)
                    .query("INSERT INTO subevent_variations (subevent_id, name, is_required) VALUES (@sid, @name, @req)");

                return { status: 201, body: JSON.stringify({ message: "Variation created" }) };
            }

        } catch (err) {
            context.log(err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});

// Helper routes for specific items (DELETE, Options append)
// We'll use specific routes for cleaner separation or handle via query params?
// Azure Functions routing 'rest' style:
// DELETE /api/variations/{vid}
// POST /api/variations/{vid}/options
// DELETE /api/variation-options/{oid}

app.http('deleteVariation', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'variations/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const pool = await getPool();
            await pool.request().input('id', sql.Int, request.params.id).query("DELETE FROM subevent_variations WHERE subevent_variation_id = @id");
            return { status: 200, body: JSON.stringify({ message: "Deleted" }) };
        } catch (e) { return { status: 500, body: JSON.stringify({ error: e.message }) }; }
    }
});

app.http('manageVariationOptions', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'variations/{id}/options',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const { name, priceAdjustment } = await request.json();
            const pool = await getPool();
            await pool.request()
                .input('vid', sql.Int, request.params.id)
                .input('name', sql.NVarChar, name)
                .input('price', sql.Decimal(10, 2), priceAdjustment || 0)
                .query("INSERT INTO subevent_variation_options (subevent_variation_id, name, price_adjustment) VALUES (@vid, @name, @price)");

            return { status: 201, body: JSON.stringify({ message: "Option added" }) };
        } catch (e) { return { status: 500, body: JSON.stringify({ error: e.message }) }; }
    }
});

app.http('deleteVariationOption', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'variation-options/{id}',
    handler: async (request, context) => {
        const user = validateToken(request);
        if (!user || user.role !== 'admin') return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const pool = await getPool();
            await pool.request().input('id', sql.Int, request.params.id).query("DELETE FROM subevent_variation_options WHERE variation_option_id = @id");
            return { status: 200, body: JSON.stringify({ message: "Deleted" }) };
        } catch (e) { return { status: 500, body: JSON.stringify({ error: e.message }) }; }
    }
});
