const { app } = require('@azure/functions');
const { sql, getPool } = require('../lib/db');

app.http('update_schema_merch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Add price column
                await transaction.request().query(`
                    IF NOT EXISTS (
                        SELECT * FROM sys.columns 
                        WHERE object_id = OBJECT_ID(N'[dbo].[product_skus]') 
                        AND name = 'price'
                    )
                    BEGIN
                        ALTER TABLE [dbo].[product_skus] ADD [price] DECIMAL(10, 2) DEFAULT 0.00;
                    END
                `);

                // 2. Add image_url column
                await transaction.request().query(`
                    IF NOT EXISTS (
                        SELECT * FROM sys.columns 
                        WHERE object_id = OBJECT_ID(N'[dbo].[product_skus]') 
                        AND name = 'image_url'
                    )
                    BEGIN
                        ALTER TABLE [dbo].[product_skus] ADD [image_url] NVARCHAR(500) NULL;
                    END
                `);

                await transaction.commit();
                return { body: JSON.stringify({ message: "Schema updated successfully." }) };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log.error('Schema update failed:', error);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
