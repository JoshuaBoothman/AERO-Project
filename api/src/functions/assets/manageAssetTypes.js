const { app } = require('@azure/functions');
const { sql, getPool } = require('../../lib/db');

app.http('manageAssetTypes', {
    methods: ['POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'assets/types/{id:int?}',
    handler: async (request, context) => {
        const method = request.method;
        const id = request.params.id;
        const pool = await getPool();

        try {
            if (method === 'POST') {
                const body = await request.json();
                const { name, description, event_id, base_hire_cost, full_event_cost, show_daily_cost, show_full_event_cost, image_url, asset_category_id, option_label } = body;

                if (!name || !event_id) {
                    return { status: 400, body: JSON.stringify({ error: "Name and Event ID are required" }) };
                }

                const result = await pool.request()
                    .input('eventId', sql.Int, event_id)
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description || '')
                    .input('cost', sql.Decimal(10, 2), base_hire_cost || 0)
                    .input('fullEventCost', sql.Decimal(10, 2), full_event_cost || null)
                    .input('showDaily', sql.Bit, show_daily_cost !== undefined ? show_daily_cost : 1)
                    .input('showFull', sql.Bit, show_full_event_cost !== undefined ? show_full_event_cost : 0)
                    .input('imageUrl', sql.NVarChar, image_url || null)
                    .input('catId', sql.Int, asset_category_id || null)
                    .input('stock', sql.Int, body.stock_quantity || 0)
                    .input('optLabel', sql.NVarChar, option_label || null)
                    .query(`
                        INSERT INTO asset_types (event_id, name, description, base_hire_cost, full_event_cost, show_daily_cost, show_full_event_cost, image_url, asset_category_id, stock_quantity, option_label)
                        OUTPUT INSERTED.*
                        VALUES (@eventId, @name, @description, @cost, @fullEventCost, @showDaily, @showFull, @imageUrl, @catId, @stock, @optLabel)
                    `);

                return { status: 201, jsonBody: result.recordset[0] };
            }

            if (method === 'PUT') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "ID required" }) };
                const body = await request.json();

                // Construct dynamic update query
                let updates = [];
                const req = pool.request().input('id', sql.Int, id);

                if (body.name !== undefined) { updates.push("name = @name"); req.input('name', sql.NVarChar, body.name); }
                if (body.description !== undefined) { updates.push("description = @desc"); req.input('desc', sql.NVarChar, body.description); }
                if (body.base_hire_cost !== undefined) { updates.push("base_hire_cost = @cost"); req.input('cost', sql.Decimal(10, 2), body.base_hire_cost); }
                if (body.full_event_cost !== undefined) { updates.push("full_event_cost = @feCost"); req.input('feCost', sql.Decimal(10, 2), body.full_event_cost); }
                if (body.show_daily_cost !== undefined) { updates.push("show_daily_cost = @showDaily"); req.input('showDaily', sql.Bit, body.show_daily_cost); }
                if (body.show_full_event_cost !== undefined) { updates.push("show_full_event_cost = @showFull"); req.input('showFull', sql.Bit, body.show_full_event_cost); }
                if (body.image_url !== undefined) { updates.push("image_url = @img"); req.input('img', sql.NVarChar, body.image_url); }
                if (body.asset_category_id !== undefined) { updates.push("asset_category_id = @catId"); req.input('catId', sql.Int, body.asset_category_id); }
                if (body.stock_quantity !== undefined) { updates.push("stock_quantity = @stock"); req.input('stock', sql.Int, body.stock_quantity); }
                if (body.option_label !== undefined) { updates.push("option_label = @optLabel"); req.input('optLabel', sql.NVarChar, body.option_label); }

                if (updates.length === 0) return { status: 400, body: "No fields to update" };

                await req.query(`UPDATE asset_types SET ${updates.join(', ')} WHERE asset_type_id = @id`);
                return { status: 200, jsonBody: { message: "Updated successfully" } };
            }

            if (method === 'DELETE') {
                if (!id) return { status: 400, body: JSON.stringify({ error: "ID required" }) };

                // Check for items first
                const check = await pool.request().input('id', sql.Int, id).query("SELECT COUNT(*) as count FROM asset_items WHERE asset_type_id = @id");
                if (check.recordset[0].count > 0) {
                    return { status: 400, body: JSON.stringify({ error: "Cannot delete Asset Type with existing items." }) };
                }

                await pool.request().input('id', sql.Int, id).query("DELETE FROM asset_types WHERE asset_type_id = @id");
                return { status: 200, jsonBody: { message: "Deleted successfully" } };
            }

        } catch (error) {
            context.error('Error in manageAssetTypes:', error);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error: " + error.message }) };
        }
    }
});
