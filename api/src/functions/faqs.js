const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken, isAdmin } = require('../lib/auth');

// Public: Get Active FAQs
app.http('getPublicFAQs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'public/faqs',
    handler: async (request, context) => {
        try {
            const pool = await getPool();
            // Get optional event_id from query if needed, currently getting all global/active
            // Assuming we want all that are active.
            // Order by display_order
            const result = await pool.request().query(`
                SELECT id, question, answer, image_url 
                FROM faqs 
                WHERE is_active = 1 
                ORDER BY display_order ASC, id ASC
            `);

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };
        } catch (error) {
            context.log(`Error fetching FAQs: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Admin: Get All FAQs (Manage)
app.http('getFAQs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manage/faqs',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const pool = await getPool();
            const result = await pool.request().query("SELECT * FROM faqs ORDER BY display_order ASC, id ASC");

            return {
                status: 200,
                body: JSON.stringify(result.recordset)
            };
        } catch (error) {
            context.log(`Error fetching FAQs: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Admin: Create FAQ
app.http('createFAQ', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'manage/faqs',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };

        try {
            const { question, answer, image_url, display_order, is_active } = await request.json();

            if (!question || !answer) {
                return { status: 400, body: JSON.stringify({ error: "Question and Answer are required." }) };
            }

            const pool = await getPool();
            const result = await pool.request()
                .input('q', sql.NVarChar(sql.MAX), question)
                .input('a', sql.NVarChar(sql.MAX), answer)
                .input('img', sql.NVarChar(500), image_url || null)
                .input('ord', sql.Int, display_order || 0)
                .input('act', sql.Bit, is_active !== undefined ? is_active : 1)
                .query(`
                    INSERT INTO faqs (question, answer, image_url, display_order, is_active)
                    VALUES (@q, @a, @img, @ord, @act);
                    SELECT SCOPE_IDENTITY() AS id;
                `);

            return {
                status: 201,
                body: JSON.stringify({ message: "FAQ created", id: result.recordset[0].id })
            };
        } catch (error) {
            context.log(`Error creating FAQ: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Admin: Update FAQ
app.http('updateFAQ', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'manage/faqs/{id}',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        const id = request.params.id;

        try {
            const { question, answer, image_url, display_order, is_active } = await request.json();

            const pool = await getPool();
            await pool.request()
                .input('id', sql.Int, id)
                .input('q', sql.NVarChar(sql.MAX), question)
                .input('a', sql.NVarChar(sql.MAX), answer)
                .input('img', sql.NVarChar(500), image_url || null)
                .input('ord', sql.Int, display_order)
                .input('act', sql.Bit, is_active)
                .query(`
                    UPDATE faqs 
                    SET question = @q, answer = @a, image_url = @img, display_order = @ord, is_active = @act, updated_at = GETDATE()
                    WHERE id = @id
                `);

            return { status: 200, body: JSON.stringify({ message: "FAQ updated" }) };
        } catch (error) {
            context.log(`Error updating FAQ: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});

// Admin: Delete FAQ
app.http('deleteFAQ', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'manage/faqs/{id}',
    handler: async (request, context) => {
        if (!isAdmin(request)) return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        const id = request.params.id;

        try {
            const pool = await getPool();
            await pool.request().input('id', sql.Int, id).query("DELETE FROM faqs WHERE id = @id");

            return { status: 200, body: JSON.stringify({ message: "FAQ deleted" }) };
        } catch (error) {
            context.log(`Error deleting FAQ: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
