const { sql, getPool } = require('../src/lib/db');

async function updateSchema() {
    try {
        const pool = await getPool();
        console.log('Connected to database.');

        // 1. Add price to product_skus if not exists
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[product_skus]') 
                    AND name = 'price'
                )
                BEGIN
                    ALTER TABLE [dbo].[product_skus] ADD [price] DECIMAL(10, 2) DEFAULT 0.00;
                    PRINT 'Added price column to product_skus';
                END
                ELSE
                BEGIN
                    PRINT 'price column already exists in product_skus';
                END
            `);
        } catch (e) {
            console.error('Error adding price column:', e.message);
        }

        // 2. Add image_url to product_skus if not exists
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[product_skus]') 
                    AND name = 'image_url'
                )
                BEGIN
                    ALTER TABLE [dbo].[product_skus] ADD [image_url] NVARCHAR(500) NULL;
                    PRINT 'Added image_url column to product_skus';
                END
                ELSE
                BEGIN
                    PRINT 'image_url column already exists in product_skus';
                END
            `);
        } catch (e) {
            console.error('Error adding image_url column:', e.message);
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
