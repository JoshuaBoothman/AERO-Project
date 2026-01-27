USE AeroProjectDB;
GO

-- 1. Add official_dinner_subevent_id to events table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'events') 
    AND name = 'official_dinner_subevent_id'
)
BEGIN
    ALTER TABLE events
    ADD official_dinner_subevent_id INT NULL;

    PRINT 'Added official_dinner_subevent_id to events table.';
END
ELSE
BEGIN
    PRINT 'official_dinner_subevent_id already exists in events table.';
END
GO

-- 2. Add includes_official_dinner to event_ticket_types table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'event_ticket_types') 
    AND name = 'includes_official_dinner'
)
BEGIN
    ALTER TABLE event_ticket_types
    ADD includes_official_dinner BIT DEFAULT 0;

    PRINT 'Added includes_official_dinner to event_ticket_types table.';
END
ELSE
BEGIN
    PRINT 'includes_official_dinner already exists in event_ticket_types table.';
END
GO

-- 3. Add Foreign Key Constraint (Optional but recommended)
-- We check if the constraint exists first
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_Events_OfficialDinnerSubevent'))
BEGIN
    -- Note: Ensure subevents table exists and subevent_id is PK. 
    -- If subevents logic is complex, might skip strict FK if soft link preferred, but usually good practice.
    ALTER TABLE events
    ADD CONSTRAINT FK_Events_OfficialDinnerSubevent
    FOREIGN KEY (official_dinner_subevent_id) REFERENCES subevents(subevent_id);

    PRINT 'Added FK_Events_OfficialDinnerSubevent constraint.';
END
GO
