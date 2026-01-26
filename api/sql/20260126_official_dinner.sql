USE [AERO_Project];
GO

-- Add Official Dinner Date to Events table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[events]') AND name = 'dinner_date')
BEGIN
    ALTER TABLE [dbo].[events] ADD [dinner_date] DATETIME NULL;
    PRINT 'Added dinner_date column to events table.';
END
ELSE
BEGIN
    PRINT 'dinner_date column already exists in events table.';
END
GO

-- Add Attending Dinner flag to Attendees table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'attending_dinner')
BEGIN
    ALTER TABLE [dbo].[attendees] ADD [attending_dinner] BIT NOT NULL DEFAULT 0;
    PRINT 'Added attending_dinner column to attendees table.';
END
ELSE
BEGIN
    PRINT 'attending_dinner column already exists in attendees table.';
END
GO
