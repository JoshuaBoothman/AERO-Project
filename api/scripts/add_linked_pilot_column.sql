-- Add linked_pilot_attendee_id to attendees table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.attendees') AND name = 'linked_pilot_attendee_id')
BEGIN
    PRINT 'Adding linked_pilot_attendee_id column to attendees table...';
    ALTER TABLE dbo.attendees ADD linked_pilot_attendee_id INT NULL;
    
    PRINT 'Adding Foreign Key constraint...';
    ALTER TABLE dbo.attendees 
    ADD CONSTRAINT FK_Attendees_LinkedPilot 
    FOREIGN KEY (linked_pilot_attendee_id) REFERENCES dbo.attendees(attendee_id);
END
ELSE
BEGIN
    PRINT 'Column linked_pilot_attendee_id already exists.';
END

PRINT 'Done.';
