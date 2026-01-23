-- Fix for "Pit Crew" system role error
-- This script updates the CK_SystemRole constraint to include 'pit_crew' and other allowed roles.

-- 1. Drop the existing constraint
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_SystemRole' AND parent_object_id = OBJECT_ID('dbo.event_ticket_types'))
BEGIN
    PRINT 'Dropping existing constraint CK_SystemRole...';
    ALTER TABLE dbo.event_ticket_types DROP CONSTRAINT CK_SystemRole;
END

-- 2. Add the updated constraint
PRINT 'Adding updated constraint CK_SystemRole...';
ALTER TABLE dbo.event_ticket_types
ADD CONSTRAINT CK_SystemRole CHECK (system_role IN ('spectator', 'pilot', 'pit_crew', 'staff', 'volunteer'));

PRINT 'Done.';
