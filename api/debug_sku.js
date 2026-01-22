const sql = require('mssql');
const config = {
    server: 'sql-aero-dev-jb.database.windows.net',
    port: 1433,
    database: 'sqldb-aero-dev',
    user: 'aero_admin',
    password: 'ZiJZ2SUjFBAWLeL',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000
    }
};

(async () => {
    try {
        await sql.connect(config);
        console.log('Connected.');

        const products = await sql.query("SELECT * FROM products WHERE name LIKE '%T-Shirt%'");
        console.log('PRODUCTS:', JSON.stringify(products.recordset, null, 2));

        if (products.recordset.length > 0) {
            for (const p of products.recordset) {
                const skus = await sql.query("SELECT * FROM product_skus WHERE product_id = " + p.product_id);
                console.log(`SKUS for Product ${p.product_id} (${p.name}):`, JSON.stringify(skus.recordset, null, 2));

                // Also check links
                const links = await sql.query("SELECT * FROM ticket_linked_products WHERE product_id = " + p.product_id);
                console.log(`LINKS for Product ${p.product_id}:`, JSON.stringify(links.recordset, null, 2));
            }
        } else {
            console.log('No T-Shirt products found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        console.log('Done.');
        process.exit();
    }
})();
