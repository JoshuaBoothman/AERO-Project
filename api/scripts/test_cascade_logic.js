const fs = require('fs');
const path = require('path');

// Load environment variables
const settingsPath = path.resolve(__dirname, '../local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) {
        Object.assign(process.env, settings.Values);
    }
}

async function testCascade() {
    try {
        const { sql, getPool } = require('../src/lib/db'); // Require after loading env
        const pool = await getPool();
        console.log('Connected to database.');

        // 1. Setup Test Data
        console.log('Creating test data...');
        const trans = new sql.Transaction(pool);
        await trans.begin();

        let optId, skuId, prodId;

        try {
            // Create Product
            const prodRes = await trans.request()
                .query("INSERT INTO products (name, description, is_active) OUTPUT INSERTED.product_id VALUES ('TestCascadeProd', 'Temp', 0)");

            console.log('prodRes:', prodRes);
            if (!prodRes || !prodRes.recordset) throw new Error('Query returned no recordset');

            prodId = prodRes.recordset[0].product_id;

            // Create Variant Category
            const catRes = await trans.request()
                .query("INSERT INTO variant_categories (name) OUTPUT INSERTED.variant_category_id VALUES ('TestCat')");
            const catId = catRes.recordset[0].variant_category_id;

            // Link Category to Product
            await trans.request()
                .input('pid', prodId).input('cid', catId)
                .query("INSERT INTO variants (product_id, variant_category_id) VALUES (@pid, @cid)");
            // Get the variant_id (variants table is a link table with an ID? schema check needed but assuming standard)
            // Wait, schema check: variants table structure?
            // getProductDetails says: SELECT v.variant_id ... FROM variants v
            // So we need that ID.
            const varRes = await trans.request().input('pid', prodId).input('cid', catId).query("SELECT variant_id FROM variants WHERE product_id=@pid AND variant_category_id=@cid");
            const varId = varRes.recordset[0].variant_id;

            // Create Option
            const optRes = await trans.request()
                .input('vid', varId)
                .query("INSERT INTO variant_options (variant_id, value, sort_order) OUTPUT INSERTED.variant_option_id VALUES (@vid, 'TestOptionToDelete', 1)");
            optId = optRes.recordset[0].variant_option_id;

            // Create SKU
            const skuRes = await trans.request()
                .input('pid', prodId)
                .query("INSERT INTO product_skus (product_id, sku_code, price, current_stock) OUTPUT INSERTED.product_sku_id VALUES (@pid, 'SKU-TEST-CASCADE', 10.00, 5)");
            skuId = skuRes.recordset[0].product_sku_id;

            // Link SKU to Option
            await trans.request()
                .input('sid', skuId).input('oid', optId)
                .query("INSERT INTO sku_option_links (product_sku_id, variant_option_id) VALUES (@sid, @oid)");

            await trans.commit();
            console.log(`Test data created. OptionID: ${optId}, SkuID: ${skuId}`);

        } catch (e) {
            await trans.rollback();
            throw new Error('Failed to setup test data: ' + e.message);
        }

        // 2. Perform Deletion Logic (Simulating the API logic)
        console.log('Executing deletion logic...');
        // Logic from deleteVariantOption.js
        const t2 = new sql.Transaction(pool);
        await t2.begin();
        try {
            // 1. Identify SKUs
            const affectedSkus = await t2.request()
                .input('optId', sql.Int, optId)
                .query("SELECT product_sku_id FROM sku_option_links WHERE variant_option_id = @optId");

            const skuIds = affectedSkus.recordset.map(r => r.product_sku_id);
            console.log('Identified SKUs to delete:', skuIds);

            if (skuIds.length > 0) {
                const list = skuIds.join(',');
                // Delete from event_skus (ignoring here as we didn't create one, but query should run fine)
                await t2.request().query(`DELETE FROM event_skus WHERE product_sku_id IN (${list})`);
                // Delete links
                await t2.request().query(`DELETE FROM sku_option_links WHERE product_sku_id IN (${list})`);
                // Delete SKUs
                await t2.request().query(`DELETE FROM product_skus WHERE product_sku_id IN (${list})`);
            }
            // Delete Option
            await t2.request().input('optId', optId).query("DELETE FROM variant_options WHERE variant_option_id = @optId");

            await t2.commit();
            console.log('Deletion transaction committed.');

        } catch (e) {
            await t2.rollback();
            throw new Error('Deletion logic failed: ' + e.message);
        }

        // 3. Verify
        const checkOpt = await pool.request().input('optId', optId).query("SELECT * FROM variant_options WHERE variant_option_id = @optId");
        const checkSku = await pool.request().input('skuId', skuId).query("SELECT * FROM product_skus WHERE product_sku_id = @skuId");

        console.log('Verification Results:');
        console.log('Option exists?', checkOpt.recordset.length > 0);
        console.log('SKU exists?', checkSku.recordset.length > 0);

        if (checkOpt.recordset.length === 0 && checkSku.recordset.length === 0) {
            console.log('SUCCESS: Cascade delete worked.');
        } else {
            console.error('FAILURE: Items still exist.');
        }

        // Cleanup Product
        await pool.request().input('pid', prodId).query("DELETE FROM variants WHERE product_id=@pid; DELETE FROM products WHERE product_id=@pid; DELETE FROM variant_categories WHERE name='TestCat'");
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        process.exit();
    }
}

testCascade();
