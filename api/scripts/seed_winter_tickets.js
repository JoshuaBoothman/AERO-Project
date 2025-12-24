const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { query, sql } = require('../src/lib/db');

        // 1. Get Event ID
        console.log("Finding 'Winter Warbirds 2026'...");
        const events = await query("SELECT event_id, name, slug FROM events WHERE name LIKE '%Winter Warbirds%'");

        if (events.length === 0) {
            console.error("Event not found!");
            return;
        }

        const eventId = events[0].event_id;
        console.log(`Found Event: ${events[0].name} (ID: ${eventId})`);

        // 2. Insert Tickets
        console.log("Inserting Pilot Ticket...");
        await query(`
            INSERT INTO event_ticket_types (event_id, name, price, system_role, is_pilot, is_pit_crew)
            VALUES (${eventId}, 'Pilot Entry', 150.00, 'pilot', 1, 0)
        `);

        console.log("Inserting Pit Crew Ticket...");
        await query(`
            INSERT INTO event_ticket_types (event_id, name, price, system_role, is_pilot, is_pit_crew)
            VALUES (${eventId}, 'Pit Crew Pass', 30.00, 'Crew', 0, 1)
        `);

        console.log("Tickets Seeded Successfully.");

    } catch (e) {
        console.error(e);
    }
}
seed();
