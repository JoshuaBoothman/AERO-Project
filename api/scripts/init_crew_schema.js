const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        // 1. Load Environment Config
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
            console.log("Loaded connection string from local.settings.json");
        } else {
            console.error("local.settings.json not found!");
            process.exit(1);
        }

        // 2. Require DB after Env setup
        const { query, sql } = require('../src/lib/db');
        console.log("Starting Schema Migration...");

        // 3. Add is_pit_crew to event_ticket_types
        try {
            console.log("Adding is_pit_crew to event_ticket_types...");
            await query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[event_ticket_types]') AND name = 'is_pit_crew')
                BEGIN
                    ALTER TABLE [dbo].[event_ticket_types] ADD [is_pit_crew] [bit] DEFAULT 0 WITH VALUES;
                    PRINT 'Added is_pit_crew column.';
                END
                ELSE
                BEGIN
                    PRINT 'is_pit_crew column already exists.';
                END
            `);
        } catch (e) {
            console.error("Error adding is_pit_crew:", e.message);
        }

        // 4. Add ticket_code to attendees
        try {
            console.log("Adding ticket_code to attendees...");
            await query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'ticket_code')
                BEGIN
                    ALTER TABLE [dbo].[attendees] ADD [ticket_code] [varchar](10) NULL;
                    PRINT 'Added ticket_code column.';
                END
                ELSE
                BEGIN
                    PRINT 'ticket_code column already exists.';
                END
            `);
        } catch (e) {
            console.error("Error adding ticket_code:", e.message);
        }

        console.log("Migration Complete.");
        process.exit(0);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
