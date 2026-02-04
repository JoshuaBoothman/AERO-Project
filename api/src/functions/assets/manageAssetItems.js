const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('manageAssetItems', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'assets/items/{id?}',
    handler: async (request, context) => {
        const method = request.method;
        const id = request.params.id;
        const pool = await getPool();

        try {
            // GET items for a specific type (filtered by query param)
            if (method === 'GET') {
                const typeId = request.query.get('typeId');
                // Filter out soft-deleted items by default
                let query = "SELECT * FROM asset_items WHERE status != 'Deleted'";
                const req = pool.request();

                if (typeId) {
                    query += " AND asset_type_id = @typeId";
                    req.input('typeId', sql.Int, typeId);
                }

                const result = await req.query(query);
                return { status: 200, jsonBody: result.recordset };
            }

            if (method === 'POST') {
                const body = await request.json();
                const { asset_type_id, identifier, serial_number, status, notes, image_url } = body;

                const result = await pool.request()
                    .input('typeId', sql.Int, asset_type_id)
                    .input('ident', sql.NVarChar, identifier)
                    .input('serial', sql.NVarChar, serial_number || null)
                    .input('status', sql.VarChar, status || 'Active')
                    .input('notes', sql.NVarChar, notes || '')
                    .input('imageUrl', sql.NVarChar, image_url || null)
                    .query(`
                        INSERT INTO asset_items (asset_type_id, identifier, serial_number, status, notes, image_url)
                        OUTPUT INSERTED.*
                        VALUES (@typeId, @ident, @serial, @status, @notes, @imageUrl)
                    `);

                return { status: 201, jsonBody: result.recordset[0] };
            }

            if (method === 'PUT') {
                if (!id) return { status: 400, body: "ID required" };
                const body = await request.json();

                let updates = [];
                const req = pool.request().input('id', sql.Int, id);

                if (body.identifier !== undefined) { updates.push("identifier = @ident"); req.input('ident', sql.NVarChar, body.identifier); }
                if (body.serial_number !== undefined) { updates.push("serial_number = @serial"); req.input('serial', sql.NVarChar, body.serial_number); }
                if (body.status !== undefined) { updates.push("status = @status"); req.input('status', sql.VarChar, body.status); }
                if (body.notes !== undefined) { updates.push("notes = @notes"); req.input('notes', sql.NVarChar, body.notes); }
                if (body.image_url !== undefined) { updates.push("image_url = @img"); req.input('img', sql.NVarChar, body.image_url); }

                if (updates.length > 0) {
                    await req.query(`UPDATE asset_items SET ${updates.join(', ')} WHERE asset_item_id = @id`);
                }
                return { status: 200, jsonBody: { message: "Item updated" } };
            }

            if (method === 'DELETE') {
                if (!id) return { status: 400, body: "ID required" };

                // Check for hires to determine Soft vs Hard delete
                const check = await pool.request()
                    .input('id', sql.Int, id)
                    .query("SELECT COUNT(*) as count FROM asset_hires WHERE asset_item_id = @id");

                const hasHistory = check.recordset[0].count > 0;

                if (hasHistory) {
                    // Soft Delete (Archive)
                    await pool.request()
                        .input('id', sql.Int, id)
                        .query("UPDATE asset_items SET status = 'Deleted' WHERE asset_item_id = @id");
                    return { status: 200, jsonBody: { message: "Item archived (Soft Delete)" } };
                } else {
                    // Hard Delete
                    await pool.request()
                        .input('id', sql.Int, id)
                        .query("DELETE FROM asset_items WHERE asset_item_id = @id");
                    return { status: 200, jsonBody: { message: "Item permanently deleted" } };
                }
            }

        } catch (error) {
            context.error('Error in manageAssetItems:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
