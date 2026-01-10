const { getPool } = require('./src/lib/db');

async function debugEvents() {
    try {
        const pool = await getPool();
        console.log("Connected to DB.");

        const events = await pool.request().query("SELECT * FROM events");
        console.log(`Found ${events.recordset.length} events in DB:`);
        console.log(JSON.stringify(events.recordset, null, 2));

        const venues = await pool.request().query("SELECT * FROM venues");
        console.log(`Found ${venues.recordset.length} venues in DB:`);
        console.log(JSON.stringify(venues.recordset, null, 2));

    } catch (err) {
        console.error("DB Error:", err);
    }
}

debugEvents();
