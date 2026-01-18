const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

console.log("Loading variantTemplates.js...");

// GET All Variant Templates
app.http('getVariantTemplates', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manage/variant-templates',
    handler: async (request, context) => {
        try {
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT t.template_id, t.name, COUNT(o.option_id) as option_count 
                FROM variant_templates t
                LEFT JOIN variant_template_options o ON t.template_id = o.template_id
                GROUP BY t.template_id, t.name
                ORDER BY t.name ASC
            `;
            const result = await query(q);

            return { jsonBody: result };
        } catch (error) {
            context.log.error(`Error getting variant templates: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// GET Single Variant Template with Options
app.http('getVariantTemplateDetail', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'manage/variant-templates/{templateId}',
    handler: async (request, context) => {
        try {
            const { templateId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Get Template
            const templateQ = `SELECT * FROM variant_templates WHERE template_id = @templateId`;
            const templateResult = await query(templateQ, [{ name: 'templateId', type: sql.Int, value: templateId }]);

            if (templateResult.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Template not found" }) };
            }

            // Get Options
            const optionsQ = `SELECT * FROM variant_template_options WHERE template_id = @templateId ORDER BY category_name, option_id`;
            const optionsResult = await query(optionsQ, [{ name: 'templateId', type: sql.Int, value: templateId }]);

            const template = templateResult[0];
            template.options = optionsResult;

            return { jsonBody: template };
        } catch (error) {
            context.log.error(`Error getting variant template detail: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// CREATE Variant Template
app.http('createVariantTemplate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'manage/variant-templates',
    handler: async (request, context) => {
        try {
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { name, options } = await request.json();

            if (!name) {
                return { status: 400, body: JSON.stringify({ error: "Template name is required" }) };
            }

            // Insert Template
            const insertTemplateQ = `
                INSERT INTO variant_templates (name)
                OUTPUT INSERTED.template_id
                VALUES (@name)
            `;
            const templateResult = await query(insertTemplateQ, [{ name: 'name', type: sql.NVarChar, value: name }]);
            const templateId = templateResult[0].template_id;

            // Insert Options
            if (options && Array.isArray(options) && options.length > 0) {
                for (const option of options) {
                    const insertOptionQ = `
                        INSERT INTO variant_template_options (template_id, category_name, option_name, price_adjustment)
                        VALUES (@templateId, @categoryName, @optionName, @priceAdjustment)
                    `;
                    await query(insertOptionQ, [
                        { name: 'templateId', type: sql.Int, value: templateId },
                        { name: 'categoryName', type: sql.NVarChar, value: option.category_name },
                        { name: 'optionName', type: sql.NVarChar, value: option.option_name },
                        { name: 'priceAdjustment', type: sql.Decimal(10, 2), value: option.price_adjustment || 0 }
                    ]);
                }
            }

            return { status: 201, jsonBody: { template_id: templateId, message: "Template created successfully" } };
        } catch (error) {
            context.log.error(`Error creating variant template: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// DELETE Variant Template
app.http('deleteVariantTemplate', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'manage/variant-templates/{templateId}',
    handler: async (request, context) => {
        try {
            const { templateId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `DELETE FROM variant_templates WHERE template_id = @templateId`;
            await query(q, [{ name: 'templateId', type: sql.Int, value: templateId }]);

            return { status: 204 };
        } catch (error) {
            context.log.error(`Error deleting variant template: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
