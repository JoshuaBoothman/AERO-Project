const fs = require('fs');
const path = require('path');

// Load settings manually BEFORE requiring db
const settingsPath = path.resolve(__dirname, 'local.settings.json');
if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
    console.log("Loaded SQL Connection String from local.settings.json");
} else {
    console.error("local.settings.json not found!");
}

const { getPool, sql } = require('./src/lib/db');

async function run() {
    try {
        const pool = await getPool();

        // 1. Get Event
        const slug = 'festival-2026';
        console.log(`Searching for event: ${slug}`);
        const eventRes = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query("SELECT event_id, name FROM events WHERE slug = @slug");

        if (eventRes.recordset.length === 0) {
            console.log("Event not found!");
            return;
        }
        const eventId = eventRes.recordset[0].event_id;
        console.log(`Event Found: ${eventRes.recordset[0].name} (ID: ${eventId})`);

        // 2. Get Campgrounds
        console.log("Searching for campgrounds...");
        const campRes = await pool.request()
            .input('eid', sql.Int, eventId)
            .query("SELECT campground_id, name FROM campgrounds WHERE event_id = @eid");

        console.log(`Found ${campRes.recordset.length} campgrounds.`);
        const campIds = campRes.recordset.map(c => c.campground_id);
        console.table(campRes.recordset);

        if (campIds.length === 0) return;

        // 3. Get Sections
        console.log("Searching for sections...");
        const sectionsRes = await pool.request()
            .query(`SELECT campground_section_id, name, campground_id FROM campground_sections`);

        console.log(`Total Sections in DB: ${sectionsRes.recordset.length}`);
        console.table(sectionsRes.recordset);

        const relevantSections = sectionsRes.recordset.filter(s => campIds.includes(s.campground_id));
        console.log(`Found ${relevantSections.length} relevant sections.`);
        console.table(relevantSections);
        const sectionIds = relevantSections.map(s => s.campground_section_id);

        if (sectionIds.length === 0) return;

        // 4. Get Campsites
        console.log("Searching for campsites...");
        const sitesRes = await pool.request()
            .query(`SELECT count(*) as total, sum(case when is_active=1 then 1 else 0 end) as active_count FROM campsites`);

        console.log("Total sites in DB:", sitesRes.recordset[0]);

        const mySitesRes = await pool.request()
            .query(`SELECT campsite_id, name, is_active, campground_section_id FROM campsites`);

        const mySites = mySitesRes.recordset.filter(s => sectionIds.includes(s.campground_section_id));
        console.log(`Found ${mySites.length} sites linked to these sections.`);
        console.table(mySites.slice(0, 10)); // Show first 10

        if (mySites.length === 0) {
            console.log("Issue: No sites link to the sections found.");
        } else {
            const activeSites = mySites.filter(s => s.is_active);
            console.log(`${activeSites.length} are active.`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
