const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('manageAssetCategories', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'assets/categories/{id:int?}',
    handler: async (request, context) => {
        const method = request.method;
        const id = request.params.id;
        const pool = await getPool();

        try {
            if (method === 'GET') {
                const eventId = request.query.get('eventId');

                let query = "SELECT * FROM asset_categories";
                const req = pool.request();

                if (eventId) {
                    query += " WHERE event_id = @eid";
                    req.input('eid', sql.Int, eventId);
                }

                query += " ORDER BY sort_order ASC, name ASC";

                const result = await req.query(query);

                return { status: 200, jsonBody: result.recordset };
            }

            if (method === 'POST') {
                const body = await request.json();
                const { event_id, name, sort_order } = body;

                if (!name) { // Removed !event_id check
                    return { status: 400, body: JSON.stringify({ error: "Name is required" }) };
                }

                // Get next sort order if not provided
                let order = sort_order;
                if (order === undefined) {
                    const maxReq = pool.request();
                    let maxQuery = "SELECT MAX(sort_order) as maxOrder FROM asset_categories";

                    if (event_id) {
                        maxQuery += " WHERE event_id = @eid";
                        maxReq.input('eid', sql.Int, event_id);
                    } else {
                        maxQuery += " WHERE event_id IS NULL";
                    }

                    const maxRes = await maxReq.query(maxQuery);
                    order = (maxRes.recordset[0].maxOrder || 0) + 1;
                }

                const result = await pool.request()
                    .input('eid', sql.Int, event_id || null) // Allow null
                    .input('name', sql.NVarChar, name)
                    .input('sort', sql.Int, order)
                    .query(`
                        INSERT INTO asset_categories (event_id, name, sort_order)
                        OUTPUT INSERTED.*
                        VALUES (@eid, @name, @sort)
                    `);

                return { status: 201, jsonBody: result.recordset[0] };
            }

            if (method === 'PUT') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "ID required" }) };
                const body = await request.json();
                const { name } = body;

                if (!name) return { status: 400, body: JSON.stringify({ error: "Name is required" }) };

                await pool.request()
                    .input('id', sql.Int, id)
                    .input('name', sql.NVarChar, name)
                    .query("UPDATE asset_categories SET name = @name WHERE asset_category_id = @id");

                return { status: 200, jsonBody: { message: "Updated successfully" } };
            }

            if (method === 'DELETE') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "ID required" }) };

                // Check dependencies (Asset Types)
                const check = await pool.request()
                    .input('id', sql.Int, id)
                    .query("SELECT COUNT(*) as count FROM asset_types WHERE asset_category_id = @id");

                if (check.recordset[0].count > 0) {
                    return { status: 400, body: JSON.stringify({ error: "Cannot delete category containing assets. Please move or delete assets first." }) };
                }

                await pool.request()
                    .input('id', sql.Int, id)
                    .query("DELETE FROM asset_categories WHERE asset_category_id = @id");

                return { status: 200, jsonBody: { message: "Deleted successfully" } };
            }

        } catch (error) {
            context.error('Error in manageAssetCategories:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error: " + error.message }) };
        }
    }
});
