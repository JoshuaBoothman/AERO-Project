const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('manageAssetTypeOptions', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'assets/types/{typeId:int}/options/{id:int?}',
    handler: async (request, context) => {
        const method = request.method;
        const typeId = request.params.typeId;
        const id = request.params.id; // Optional for GET/POST
        const pool = await getPool();

        try {
            // GET: List active options for an asset type
            if (method === 'GET') {
                const result = await pool.request()
                    .input('tid', sql.Int, typeId)
                    .query(`
                        SELECT * FROM asset_type_options 
                        WHERE asset_type_id = @tid AND is_active = 1
                        ORDER BY sort_order ASC, label ASC
                    `);

                return { status: 200, jsonBody: result.recordset };
            }

            // POST: Create new option
            if (method === 'POST') {
                const body = await request.json();
                const { label } = body;

                if (!label) {
                    return { status: 400, body: JSON.stringify({ error: "Label is required" }) };
                }

                // Get next sort order
                const sortRes = await pool.request()
                    .input('tid', sql.Int, typeId)
                    .query("SELECT ISNULL(MAX(sort_order), 0) + 1 as next_sort FROM asset_type_options WHERE asset_type_id = @tid");
                const nextSort = sortRes.recordset[0].next_sort;

                const result = await pool.request()
                    .input('tid', sql.Int, typeId)
                    .input('label', sql.NVarChar, label)
                    .input('sort', sql.Int, nextSort)
                    .query(`
                        INSERT INTO asset_type_options (asset_type_id, label, sort_order, is_active)
                        VALUES (@tid, @label, @sort, 1);
                        SELECT * FROM asset_type_options WHERE asset_type_option_id = SCOPE_IDENTITY();
                    `);

                return { status: 201, jsonBody: result.recordset[0] };
            }

            // PUT: Update option
            if (method === 'PUT') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "Option ID required" }) };
                const body = await request.json();

                let updates = [];
                const req = pool.request().input('id', sql.Int, id).input('tid', sql.Int, typeId);

                // Security check: Ensure option belongs to type (though ID is unique usually)
                // Just relying on ID update is typical, but let's be safe if needed. 
                // For now, standard update.

                if (body.label !== undefined) {
                    updates.push("label = @label");
                    req.input('label', sql.NVarChar, body.label);
                }
                if (body.sort_order !== undefined) {
                    updates.push("sort_order = @sort");
                    req.input('sort', sql.Int, body.sort_order);
                }

                if (updates.length > 0) {
                    await req.query(`UPDATE asset_type_options SET ${updates.join(', ')} WHERE asset_type_option_id = @id`);
                }

                return { status: 200, jsonBody: { message: "Updated" } };
            }

            // DELETE: Soft delete preferred, or Hard delete if unused? 
            // Plan says: Hard-delete if unused, else soft-delete.
            if (method === 'DELETE') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "Option ID required" }) };

                // Check usage
                const usageCheck = await pool.request()
                    .input('id', sql.Int, id)
                    .query("SELECT COUNT(*) as count FROM asset_hires WHERE selected_option_id = @id");

                if (usageCheck.recordset[0].count > 0) {
                    // In use -> Soft Delete
                    await pool.request()
                        .input('id', sql.Int, id)
                        .query("UPDATE asset_type_options SET is_active = 0 WHERE asset_type_option_id = @id");
                    return { status: 200, jsonBody: { message: "Option soft-deleted (in use)" } };
                } else {
                    // Not in use -> Hard Delete
                    await pool.request()
                        .input('id', sql.Int, id)
                        .query("DELETE FROM asset_type_options WHERE asset_type_option_id = @id");
                    return { status: 200, jsonBody: { message: "Option permanently deleted" } };
                }
            }

        } catch (error) {
            context.error('Error in manageAssetTypeOptions:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
