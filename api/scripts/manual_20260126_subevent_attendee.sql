/*
  RUN ON: sqldb-aero-dev AND sqldb-aero-master
  PURPOSE: Add attendee_id to subevent_registrations to link subevents to specific persons.
*/

IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID(N'[dbo].[subevent_registrations]') 
  AND name = 'attendee_id'
)
BEGIN
  ALTER TABLE [dbo].[subevent_registrations]
  ADD [attendee_id] INT NULL;

  PRINT 'Column attendee_id added to subevent_registrations';
END
ELSE
BEGIN
  PRINT 'Column attendee_id already exists on subevent_registrations';
END
