-- Test Data Generation Script for Flight Line Duties Testing
-- Run this script to populate test data for Phase 5 (Auto-Assign) testing

-- INSTRUCTIONS:
-- 1. Update @EventId to your actual event ID
-- 2. Run the discover_schema.sql script first if you want to verify the structure
-- 3. Run this script to create 10 test pilots

DECLARE @EventId INT = 9; -- CHANGE THIS TO YOUR EVENT ID
DECLARE @Counter INT = 1;
DECLARE @PersonId INT;
DECLARE @AttendeeId INT;
DECLARE @TicketTypeId INT;

PRINT 'Generating test data for Event ID: ' + CAST(@EventId AS VARCHAR);

-- Get a pilot ticket type ID from the event (system_role = 'pilot')
SELECT TOP 1 @TicketTypeId = ticket_type_id 
FROM event_ticket_types 
WHERE event_id = @EventId AND system_role = 'pilot';

IF @TicketTypeId IS NULL
BEGIN
    PRINT '❌ ERROR: No pilot ticket types found for this event.';
    PRINT 'Please create a pilot ticket type first (system_role = ''pilot'')';
    RETURN;
END

PRINT 'Using pilot ticket type ID: ' + CAST(@TicketTypeId AS VARCHAR);

-- Create 10 test pilots with flight_line_duties = 1
WHILE @Counter <= 10
BEGIN
    -- Create person record first
    INSERT INTO persons (
        first_name,
        last_name,
        email,
        phone,
        user_id  -- Set to NULL for test data (or link to actual user if needed)
    )
    VALUES (
        'TestPilot',
        'FL' + RIGHT('00' + CAST(@Counter AS VARCHAR), 2),
        'testpilot.fl' + CAST(@Counter AS VARCHAR) + '@example.com',
        '555-FL' + RIGHT('00' + CAST(@Counter AS VARCHAR), 2),
        NULL
    );
    
    SET @PersonId = SCOPE_IDENTITY();
    
    -- Insert Attendee linked to person
    INSERT INTO attendees (
        event_id,
        person_id,
        ticket_type_id,
        status,
        ticket_code,
        has_agreed_to_mop,
        flight_line_duties,
        arrival_date,
        departure_date
    )
    VALUES (
        @EventId,
        @PersonId,
        @TicketTypeId,
        'Registered',
        'TEST-FL-' + RIGHT('000' + CAST(@Counter AS VARCHAR), 3),
        1, -- Agreed to MOP
        1, -- flight_line_duties enabled
        DATEADD(DAY, 1, (SELECT start_date FROM events WHERE event_id = @EventId)), -- Arrives day 2
        DATEADD(DAY, -1, (SELECT end_date FROM events WHERE event_id = @EventId)) -- Leaves day before end
    );
    
    SET @AttendeeId = SCOPE_IDENTITY();
    SET @Counter = @Counter + 1;
    
    PRINT 'Created: TestPilot FL' + RIGHT('00' + CAST(@Counter - 1 AS VARCHAR), 2) + 
          ' (Person ID: ' + CAST(@PersonId AS VARCHAR) + ', Attendee ID: ' + CAST(@AttendeeId AS VARCHAR) + ')';
END

PRINT '';
PRINT '✅ Created 10 test pilots with flight_line_duties enabled';

-- Optional: Create some subevent registrations for conflict testing
DECLARE @SubeventId INT;

IF EXISTS (SELECT 1 FROM subevents WHERE event_id = @EventId)
BEGIN
    -- Register first 3 test pilots to a subevent (for conflict testing)
    SELECT TOP 1 @SubeventId = subevent_id FROM subevents WHERE event_id = @EventId;
    
    INSERT INTO subevent_registrations (subevent_id, attendee_id)
    SELECT TOP 3 @SubeventId, a.attendee_id
    FROM attendees a
    JOIN persons p ON a.person_id = p.person_id
    WHERE a.event_id = @EventId 
      AND a.ticket_code LIKE 'TEST-FL-%'
    ORDER BY a.attendee_id;
    
    PRINT '✅ Registered 3 test pilots to a subevent (for conflict testing)';
END
ELSE
BEGIN
    PRINT 'ℹ️  No subevents found - skipping subevent registration';
END

-- Display summary
PRINT '';
PRINT '=== TEST DATA SUMMARY ===';
PRINT 'Event ID: ' + CAST(@EventId AS VARCHAR);
PRINT 'Persons Created: 10';
PRINT 'Attendees Created: 10';
PRINT 'All attendees have flight_line_duties = 1';
PRINT 'All attendees have status = ''Registered''';
PRINT 'Arrival/Departure dates set to event day 2 to day before end';
PRINT 'Ticket Type ID: ' + CAST(@TicketTypeId AS VARCHAR);
PRINT '';
PRINT '🎯 Ready for Auto-Assign testing!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Ensure you have flight lines created';
PRINT '2. Ensure you have schedules created (which generate roster slots)';
PRINT '3. Click "🎯 Auto-Assign All" button in the Flight Lines Setup page';
PRINT '';
PRINT 'To clean up test data later, run:';
PRINT 'DELETE FROM attendees WHERE event_id = ' + CAST(@EventId AS VARCHAR) + ' AND ticket_code LIKE ''TEST-FL-%'';';
PRINT 'DELETE FROM persons WHERE email LIKE ''testpilot.fl%@example.com'';';
