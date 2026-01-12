const { getPool, sql } = require('./src/lib/db');

async function run() {
    try {
        console.log("Connecting...");
        const pool = await getPool();

        console.log("Fetching Events...");
        const events = await pool.request().query("SELECT event_id, name, slug FROM events");
        console.log("Events found:", events.recordset);

        console.log("Fetching All Products...");
        const products = await pool.request().query("SELECT product_id, name FROM products");
        console.log(`Total Products: ${products.recordset.length}`);

        for (const event of events.recordset) {
            console.log(`\nChecking Event: ${event.name} (${event.slug})`);
            const links = await pool.request()
                .input('eid', sql.Int, event.event_id)
                .query(`
                    SELECT es.event_sku_id, es.is_enabled, p.name as product_name
                    FROM event_skus es
                    JOIN product_skus ps ON es.product_sku_id = ps.product_sku_id
                    JOIN products p ON ps.product_id = p.product_id
                    WHERE es.event_id = @eid
                `);

            console.log(`  Linked Items: ${links.recordset.length}`);
            links.recordset.forEach(l => {
                console.log(`    - ${l.product_name} (Enabled: ${l.is_enabled})`);
            });
        }

    } catch (err) {
        console.error("Error:", err);
    }
    process.exit();
}

run();
