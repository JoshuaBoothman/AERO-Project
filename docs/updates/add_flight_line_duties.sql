-- Add flight_line_duties column to attendees table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'flight_line_duties')
BEGIN
    ALTER TABLE [dbo].[attendees] ADD [flight_line_duties] BIT DEFAULT 0;
END
