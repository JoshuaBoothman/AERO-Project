const fs = require('fs');
const path = require('path');

// Load env from local.settings.json
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load local.settings.json", e);
}

const { sql, query } = require('../src/lib/db');

async function seedDemoData() {
    try {
        console.log('Seeding Demo Data...');

        // 1. Get Event (Open Day) or create one
        let eventId;
        const eventRes = await query("SELECT event_id FROM events WHERE slug = 'open-day-2026'");
        if (eventRes && eventRes.length > 0) {
            eventId = eventRes[0].event_id;
            console.log(`Found Event: ${eventId}`);
        } else {
            console.log('Creating Demo Event...');
            const venueRes = await query("SELECT TOP 1 venue_id FROM venues");
            const venueId = venueRes.length > 0 ? venueRes[0].venue_id : 1; // Fallback

            const res = await query(`
                INSERT INTO events (venue_id, name, slug, start_date, end_date, is_purchasing_enabled, is_public_viewable, status)
                VALUES (@vid, 'Open Day 2026', 'open-day-2026', '2026-06-01', '2026-06-03', 1, 1, 'Published');
                SELECT SCOPE_IDENTITY() AS id
            `, [{ name: 'vid', type: sql.Int, value: venueId }]);
            eventId = res[0].id;
        }

        // 2. Clear existing demo data for this event (optional, but good for idempotency)
        // BE CAREFUL: In production don't do this. This is for dev skeleton.
        // Skipping delete for safety, checking existence instead.

        // 3. Create Product: "Official Event T-Shirt"
        console.log('Checking/Creating Product...');
        let productId;
        const prodCheck = await query("SELECT product_id FROM products WHERE name = 'Official Event T-Shirt'");
        if (prodCheck && prodCheck.length > 0) {
            productId = prodCheck[0].product_id;
        } else {
            const pRes = await query(`
                INSERT INTO products (name, description, base_image_url, is_active)
                VALUES ('Official Event T-Shirt', 'Commemorative T-Shirt for Open Day 2026', 'https://placehold.co/400x400?text=T-Shirt', 1);
                SELECT SCOPE_IDENTITY() AS id
            `);
            productId = pRes[0].id;
        }

        // Create Variants (Sizes)
        const sizes = ['Small', 'Medium', 'Large', 'XL'];
        const varCatRes = await query("SELECT variant_category_id FROM variant_categories WHERE name = 'Size'");
        let varCatId;
        if (varCatRes.length > 0) {
            varCatId = varCatRes[0].variant_category_id;
        } else {
            const vc = await query("INSERT INTO variant_categories (name) VALUES ('Size'); SELECT SCOPE_IDENTITY() as id");
            varCatId = vc[0].id;
        }

        for (const size of sizes) {
            // Create Variant Option if not exists
            // (Skipping deep check for brevity, assuming fresh db mostly)
            // Find variant_option for this size? No, `variant_options` links to `variants`? 
            // Wait, schema: `variants` (product_id, variant_category_id). `variant_options` (variant_id, value).

            // 1. Link Product to Category "Size"
            let variantId;
            const vCheck = await query("SELECT variant_id FROM variants WHERE product_id = @pid AND variant_category_id = @vcid", [
                { name: 'pid', type: sql.Int, value: productId }, { name: 'vcid', type: sql.Int, value: varCatId }
            ]);
            if (vCheck.length > 0) variantId = vCheck[0].variant_id;
            else {
                const v = await query("INSERT INTO variants (product_id, variant_category_id) VALUES (@pid, @vcid); SELECT SCOPE_IDENTITY() as id", [
                    { name: 'pid', type: sql.Int, value: productId }, { name: 'vcid', type: sql.Int, value: varCatId }
                ]);
                variantId = v[0].id;
            }

            // 2. Create Option Value (e.g. "Small")
            let optId;
            const voCheck = await query("SELECT variant_option_id FROM variant_options WHERE variant_id = @vid AND value = @val", [
                { name: 'vid', type: sql.Int, value: variantId }, { name: 'val', type: sql.NVarChar, value: size }
            ]);
            if (voCheck.length > 0) optId = voCheck[0].variant_option_id;
            else {
                const vo = await query("INSERT INTO variant_options (variant_id, value) VALUES (@vid, @val); SELECT SCOPE_IDENTITY() as id", [
                    { name: 'vid', type: sql.Int, value: variantId }, { name: 'val', type: sql.NVarChar, value: size }
                ]);
                optId = vo[0].id;
            }

            // 3. Create Product SKU
            const skuCode = `TSHIRT-${size.toUpperCase()}`;
            const skuCheck = await query("SELECT product_sku_id FROM product_skus WHERE sku_code = @code", [{ name: 'code', type: sql.NVarChar, value: skuCode }]);
            let skuId;
            if (skuCheck.length > 0) skuId = skuCheck[0].product_sku_id;
            else {
                const sk = await query("INSERT INTO product_skus (product_id, sku_code, current_stock, is_active) VALUES (@pid, @code, 100, 1); SELECT SCOPE_IDENTITY() as id", [
                    { name: 'pid', type: sql.Int, value: productId }, { name: 'code', type: sql.NVarChar, value: skuCode }
                ]);
                skuId = sk[0].id;
            }

            // 4. Link SKU to Option
            await query("DELETE FROM sku_option_links WHERE product_sku_id = @sid", [{ name: 'sid', type: sql.Int, value: skuId }]);
            await query("INSERT INTO sku_option_links (product_sku_id, variant_option_id) VALUES (@sid, @oid)", [
                { name: 'sid', type: sql.Int, value: skuId }, { name: 'oid', type: sql.Int, value: optId }
            ]);

            // 5. Link SKU to Event (Pricing)
            const esCheck = await query("SELECT event_sku_id FROM event_skus WHERE event_id = @eid AND product_sku_id = @sid", [
                { name: 'eid', type: sql.Int, value: eventId }, { name: 'sid', type: sql.Int, value: skuId }
            ]);
            if (esCheck.length === 0) {
                await query("INSERT INTO event_skus (event_id, product_sku_id, price, is_enabled) VALUES (@eid, @sid, 29.99, 1)", [
                    { name: 'eid', type: sql.Int, value: eventId }, { name: 'sid', type: sql.Int, value: skuId }
                ]);
            }
        }
        console.log('Merchandise Created.');


        // 4. Create Asset: "Honda Generator 2kVA"
        console.log('Checking/Creating Asset...');
        const assetName = "Honda Generator 2kVA";
        const assetCheck = await query("SELECT asset_type_id FROM asset_types WHERE name = @nm AND event_id = @eid", [
            { name: 'nm', type: sql.NVarChar, value: assetName }, { name: 'eid', type: sql.Int, value: eventId }
        ]);
        if (assetCheck.length === 0) {
            await query(`
                INSERT INTO asset_types (event_id, name, description, base_hire_cost)
                VALUES (@eid, @nm, 'Portable generator for campsite power.', 50.00)
             `, [
                { name: 'eid', type: sql.Int, value: eventId }, { name: 'nm', type: sql.NVarChar, value: assetName }
            ]);
        }

        // Ensure Asset Items (Physical instances) exist
        const atId = await query("SELECT asset_type_id FROM asset_types WHERE name = @nm AND event_id = @eid", [
            { name: 'nm', type: sql.NVarChar, value: assetName }, { name: 'eid', type: sql.Int, value: eventId }
        ]);
        if (atId.length > 0) {
            const typeId = atId[0].asset_type_id;
            // Create 5 generators
            for (let i = 1; i <= 5; i++) {
                const ident = `GEN-${i.toString().padStart(3, '0')}`;
                const exist = await query("SELECT asset_item_id FROM asset_items WHERE identifier = @id", [{ name: 'id', type: sql.NVarChar, value: ident }]);
                if (exist.length === 0) {
                    await query("INSERT INTO asset_items (asset_type_id, identifier, status) VALUES (@atid, @id, 'Active')", [
                        { name: 'atid', type: sql.Int, value: typeId }, { name: 'id', type: sql.NVarChar, value: ident }
                    ]);
                }
            }
        }
        console.log('Assets Created.');
        console.log('Assets Created.');

        // 5. Create Subevent: "Gala Dinner"
        console.log('Checking/Creating Subevent...');
        const subName = "Gala Dinner";
        const subCheck = await query("SELECT subevent_id FROM subevents WHERE name = @nm AND event_id = @eid", [
            { name: 'nm', type: sql.NVarChar, value: subName }, { name: 'eid', type: sql.Int, value: eventId }
        ]);
        if (subCheck.length === 0) {
            await query(`
                INSERT INTO subevents (event_id, name, description, start_time, end_time, capacity, cost)
                VALUES (@eid, @nm, 'A formal dinner to celebrate.', '2026-06-02 19:00:00', '2026-06-02 22:00:00', 200, 85.00)
            `, [
                { name: 'eid', type: sql.Int, value: eventId }, { name: 'nm', type: sql.NVarChar, value: subName }
            ]);
        }
        console.log('Subevents Created.');

        // 6. Create Ticket Type: "General Entry" (Required for Attendees)
        console.log('Checking/Creating Ticket Type...');
        const ttName = "General Entry";
        const ttCheck = await query("SELECT ticket_type_id FROM event_ticket_types WHERE name = @nm AND event_id = @eid", [
            { name: 'nm', type: sql.NVarChar, value: ttName }, { name: 'eid', type: sql.Int, value: eventId }
        ]);
        if (ttCheck.length === 0) {
            await query(`
                INSERT INTO event_ticket_types (event_id, name, price, system_role, is_pilot, is_pit_crew)
                VALUES (@eid, @nm, 0.00, 'Spectator', 0, 0)
            `, [
                { name: 'eid', type: sql.Int, value: eventId }, { name: 'nm', type: sql.NVarChar, value: ttName }
            ]);
        }
        console.log('Ticket Types Created.');

        console.log('Seed Complete!');

    } catch (e) {
        console.error('Seed Failed:', e);
    }
}

seedDemoData();
