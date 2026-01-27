const sql = require('mssql');

const config = {
    user: 'aero_admin',
    password: 'ZiJZ2SUjFBAWLeL',
    server: 'sql-aero-dev-jb.database.windows.net',
    database: 'sqldb-aero-dev',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function applyChanges() {
    try {
        await sql.connect(config);

        console.log("Applying DB changes...");

        const request = new sql.Request();

        // 1. Add official_dinner_subevent_id to events table
        await request.query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'events') 
                AND name = 'official_dinner_subevent_id'
            )
            BEGIN
                ALTER TABLE events
                ADD official_dinner_subevent_id INT NULL;
            END
        `);
        console.log("Step 1 (events column) checked/applied.");

        // 2. Add includes_official_dinner to event_ticket_types table
        await request.query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'event_ticket_types') 
                AND name = 'includes_official_dinner'
            )
            BEGIN
                ALTER TABLE event_ticket_types
                ADD includes_official_dinner BIT DEFAULT 0;
            END
        `);
        console.log("Step 2 (ticket types column) checked/applied.");

        // 3. Add Foreign Key Constraint
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_Events_OfficialDinnerSubevent'))
            BEGIN
                -- Make sure subevents table exists first to avoid error if this is run in weird order, but it should exist.
                ALTER TABLE events
                ADD CONSTRAINT FK_Events_OfficialDinnerSubevent
                FOREIGN KEY (official_dinner_subevent_id) REFERENCES subevents(subevent_id);
            END
        `);
        console.log("Step 3 (FK) checked/applied.");

        console.log("Done.");

    } catch (err) {
        console.error("Database error:", err);
    } finally {
        await sql.close();
    }
}

applyChanges();
