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

async function freshStart() {
    try {
        console.log('\n!!! INITIATING FRESH START 2026 !!!');
        console.log('-----------------------------------');
        console.log('Purging database (preserving Users/Admins)...');

        const tables = [
            'event_planes',
            'pilot_pit_crews',
            'checkin_logs',
            'asset_hires',
            'subevent_registrations',
            'campsite_bookings', // ...
            'order_items',
            // ...
            'attendees',
            'transactions',
            'orders',
            'event_skus',
            'sku_option_links',
            'product_skus',
            'variant_options',
            'variants',
            'variant_categories',
            'products',
            'asset_items',
            'asset_types',
            'subevents',
            'event_ticket_types',
            'campsites',
            'campground_sections',
            'campgrounds',
            'events'
        ];

        for (const table of tables) {
            process.stdout.write(`Deleting ${table}... `);
            try {
                await query(`DELETE FROM ${table}`);
                console.log('OK');
            } catch (err) {
                fs.appendFileSync('error.txt', `${table}: ${err.message}\n`); // Append error
                console.log(`FAILED: See error.txt`);
            }
        }
        console.log('Purge Complete.\n');

        // ---------------------------------------------------------
        // SEEDING
        // ---------------------------------------------------------
        console.log('Seeding Festival of Aeromodelling 2026...');

        // 1. Venue: Inglewood
        let venueId;
        const vRes = await query("SELECT venue_id FROM venues WHERE name = 'Inglewood MacIntyre Sports Complex'");
        if (vRes.length > 0) venueId = vRes[0].venue_id;
        else {
            const nv = await query(`
                INSERT INTO venues (
                    name, address_line_1, city, state, postcode, 
                    contact_name, contact_email, contact_phone,
                    latitude, longitude, elevation_ft, timezone, map_url, is_active
                ) 
                VALUES (
                    'Inglewood MacIntyre Sports Complex', 'Cunningham Hwy', 'Inglewood', 'QLD', '4387', 
                    'Event Manager', 'info@aeromodelling.com.au', '0400000000',
                    -28.4167, 151.0833, 920, 'Australia/Brisbane', '', 1
                );
                SELECT SCOPE_IDENTITY() as id
            `);
            venueId = nv[0].id;
        }

        // 2. Event: Festival of Aeromodelling 2026
        const eRes = await query(`
            INSERT INTO events (venue_id, name, slug, start_date, end_date, is_purchasing_enabled, is_public_viewable, status)
            VALUES (@vid, 'Festival of Aeromodelling 2026', 'festival-2026', '2026-07-04', '2026-07-12', 1, 1, 'Published');
            SELECT SCOPE_IDENTITY() as id
        `, [{ name: 'vid', type: sql.Int, value: venueId }]);
        const eventId = eRes[0].id;
        console.log(`Event Created: Festival of Aeromodelling 2026 (ID: ${eventId})`);

        // 3. Ticket Types
        await query(`
            INSERT INTO event_ticket_types (event_id, name, price, system_role, is_pilot, is_pit_crew) VALUES 
            (@eid, 'MAAA Pilot Registration', 150.00, 'Pilot', 1, 0),
            (@eid, 'Spectator Day Pass', 10.00, 'Spectator', 0, 0),
            (@eid, 'Family Pass (2A+2C)', 30.00, 'Spectator', 0, 0);
        `, [{ name: 'eid', type: sql.Int, value: eventId }]);
        console.log('Ticket Types Created.');

        // 4. Campground: "Inglewood Camping"
        const cgRes = await query(`
            INSERT INTO campgrounds (event_id, name, description, map_image_url)
            VALUES (@eid, 'Inglewood Event Camping', 'On-site camping with amenities.', '/maps/inglewood-camp.png');
            SELECT SCOPE_IDENTITY() as id
        `, [{ name: 'eid', type: sql.Int, value: eventId }]);
        const campgroundId = cgRes[0].id;

        // 4b. Campsites (Demo: 10 Powered, 20 Unpowered)
        // Section A: Powered (Row at 30%)
        const sectA = await query(`INSERT INTO campground_sections (campground_id, name) VALUES (@cid, 'Powered Sites'); SELECT SCOPE_IDENTITY() as id`, [{ name: 'cid', type: sql.Int, value: campgroundId }]);
        for (let i = 1; i <= 10; i++) {
            const coords = JSON.stringify({ x: 10 + (i * 8), y: 30 });
            await query(`INSERT INTO campsites (campground_section_id, name, price_per_night, is_powered, max_occupancy, map_coordinates, is_active) VALUES (@sid, 'P-${i}', 35.00, 1, 6, @coords, 1)`, [
                { name: 'sid', type: sql.Int, value: sectA[0].id },
                { name: 'coords', type: sql.NVarChar, value: coords }
            ]);
        }

        // Section B: Unpowered (Row at 60%)
        const sectB = await query(`INSERT INTO campground_sections (campground_id, name) VALUES (@cid, 'Unpowered Sites'); SELECT SCOPE_IDENTITY() as id`, [{ name: 'cid', type: sql.Int, value: campgroundId }]);
        for (let i = 1; i <= 20; i++) {
            const coords = JSON.stringify({ x: 5 + (i * 4), y: 60 });
            await query(`INSERT INTO campsites (campground_section_id, name, price_per_night, is_powered, max_occupancy, map_coordinates, is_active) VALUES (@sid, 'U-${i}', 25.00, 0, 6, @coords, 1)`, [
                { name: 'sid', type: sql.Int, value: sectB[0].id },
                { name: 'coords', type: sql.NVarChar, value: coords }
            ]);
        }
        console.log('Campground & Sites Created.');

        // 5. Products (Merch)
        // T-Shirt
        const pRes = await query(`INSERT INTO products (name, description, base_image_url, is_active) VALUES ('Festival 2026 T-Shirt', 'Official Event Shirt', '/images/tshirt-2026.png', 1); SELECT SCOPE_IDENTITY() as id`);
        const prodId = pRes[0].id;

        // Sizes Category
        let sizeCatId;
        const scCheck = await query("SELECT variant_category_id FROM variant_categories WHERE name='Size'");
        if (scCheck.length > 0) sizeCatId = scCheck[0].variant_category_id;
        else {
            const sc = await query("INSERT INTO variant_categories (name) VALUES ('Size'); SELECT SCOPE_IDENTITY() as id");
            sizeCatId = sc[0].id;
        }

        // Variant & Options
        const varRes = await query("INSERT INTO variants (product_id, variant_category_id) VALUES (@pid, @vcid); SELECT SCOPE_IDENTITY() as id", [{ name: 'pid', type: sql.Int, value: prodId }, { name: 'vcid', type: sql.Int, value: sizeCatId }]);
        const variantId = varRes[0].id;

        const sizes = ['S', 'M', 'L', 'XL', '2XL'];
        for (const s of sizes) {
            const vo = await query("INSERT INTO variant_options (variant_id, value) VALUES (@vid, @val); SELECT SCOPE_IDENTITY() as id", [{ name: 'vid', type: sql.Int, value: variantId }, { name: 'val', type: sql.NVarChar, value: s }]);

            // SKU
            const skuCode = `FEST26-TS-${s}`;
            const sk = await query("INSERT INTO product_skus (product_id, sku_code, current_stock, is_active) VALUES (@pid, @code, 500, 1); SELECT SCOPE_IDENTITY() as id", [{ name: 'pid', type: sql.Int, value: prodId }, { name: 'code', type: sql.NVarChar, value: skuCode }]);
            const skuId = sk[0].id;

            // Link
            await query("INSERT INTO sku_option_links (product_sku_id, variant_option_id) VALUES (@sid, @oid)", [{ name: 'sid', type: sql.Int, value: skuId }, { name: 'oid', type: sql.Int, value: vo[0].id }]);

            // Event Pricing
            await query("INSERT INTO event_skus (event_id, product_sku_id, price, is_enabled) VALUES (@eid, @sid, 35.00, 1)", [{ name: 'eid', type: sql.Int, value: eventId }, { name: 'sid', type: sql.Int, value: skuId }]);
        }
        console.log('Merchandise Created.');

        // 6. Assets
        const assetName = "Marquee (3x3m)";
        await query(`INSERT INTO asset_types (event_id, name, description, base_hire_cost) VALUES (@eid, @nm, 'Pop-up shade structure.', 40.00)`, [{ name: 'eid', type: sql.Int, value: eventId }, { name: 'nm', type: sql.NVarChar, value: assetName }]);
        console.log('Assets Created.');

        // 7. Subevents
        await query(`
            INSERT INTO subevents (event_id, name, description, start_time, end_time, capacity, cost) VALUES 
            (@eid, 'Presentation Dinner', 'Awards night dinner.', '2026-07-11 18:30:00', '2026-07-11 22:00:00', 300, 65.00),
            (@eid, 'Build Clinic', 'Learn balsa building techniques.', '2026-07-06 10:00:00', '2026-07-06 12:00:00', 20, 0.00);
        `, [{ name: 'eid', type: sql.Int, value: eventId }]);
        console.log('Subevents Created.');

        console.log('\n-----------------------------------');
        console.log('SUCCESS: Fresh Start 2026 Complete!');
        console.log('-----------------------------------');
        process.exit(0);

    } catch (e) {
        fs.appendFileSync('error.txt', `\nCRITICAL FAILURE:\n${e.stack || e.message}\n`);
        console.error('\n!!! CRITICAL FAILURE !!!');
        console.error(e);
        process.exit(1);
    }
}

freshStart();
