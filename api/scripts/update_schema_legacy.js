const { getPool } = require('../src/lib/db');

(async () => {
    try {
        const pool = await getPool();

        console.log("Adding is_legacy_import to users...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_legacy_import')
            BEGIN
                ALTER TABLE users ADD is_legacy_import BIT DEFAULT 0;
                PRINT 'Added is_legacy_import to users';
            END
        `);

        console.log("Adding booking_source to orders...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'booking_source')
            BEGIN
                ALTER TABLE orders ADD booking_source NVARCHAR(50) DEFAULT 'Online';
                PRINT 'Added booking_source to orders';
            END
        `);

        console.log("Done.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
})();
