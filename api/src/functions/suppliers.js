const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken, isAdmin } = require('../lib/auth');

// Get All Suppliers (Admin)
app.http('getSuppliers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'suppliers',
    handler: async (request, context) => {
        // Auth check - Suppliers are strictly an admin/management concept for now
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const pool = await getPool();
            const result = await pool.request().query("SELECT * FROM merchandise_suppliers ORDER BY name ASC");

            return {
                status: 200,
                jsonBody: result.recordset
            };
        } catch (error) {
            context.log(`Error fetching suppliers: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Create Supplier
app.http('createSupplier', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'suppliers',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const { name, contact_name, phone, email } = await request.json();

            if (!name) {
                return { status: 400, body: JSON.stringify({ error: "Name is required." }) };
            }

            const pool = await getPool();
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('contact', sql.NVarChar, contact_name || null)
                .input('phone', sql.NVarChar, phone || null)
                .input('email', sql.NVarChar, email || null)
                .query(`
                    INSERT INTO merchandise_suppliers (name, contact_name, phone, email, is_active)
                    VALUES (@name, @contact, @phone, @email, 1);
                    SELECT SCOPE_IDENTITY() AS id;
                `);

            return {
                status: 201,
                jsonBody: { message: "Supplier created", id: result.recordset[0].id }
            };
        } catch (error) {
            context.log(`Error creating supplier: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Update Supplier
app.http('updateSupplier', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'suppliers/{id}',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        const id = request.params.id;

        try {
            const { name, contact_name, phone, email, is_active } = await request.json();

            const pool = await getPool();
            const req = pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('contact', sql.NVarChar, contact_name || null)
                .input('phone', sql.NVarChar, phone || null)
                .input('email', sql.NVarChar, email || null);

            let query = `
                UPDATE merchandise_suppliers 
                SET name = @name, 
                    contact_name = @contact, 
                    phone = @phone, 
                    email = @email
            `;

            if (is_active !== undefined) {
                query += `, is_active = @active`;
                req.input('active', sql.Bit, is_active);
            }

            query += ` WHERE supplier_id = @id`;

            await req.query(query);

            return { status: 200, jsonBody: { message: "Supplier updated" } };
        } catch (error) {
            context.log(`Error updating supplier: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
