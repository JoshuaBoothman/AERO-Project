-- Add columns to persons table if they do not exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'date_of_birth')
    ALTER TABLE [dbo].[persons] ADD [date_of_birth] DATE NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'address_line_1')
    ALTER TABLE [dbo].[persons] ADD [address_line_1] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'city')
    ALTER TABLE [dbo].[persons] ADD [city] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'state')
    ALTER TABLE [dbo].[persons] ADD [state] NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'postcode')
    ALTER TABLE [dbo].[persons] ADD [postcode] NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'emergency_contact_name')
    ALTER TABLE [dbo].[persons] ADD [emergency_contact_name] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[persons]') AND name = 'emergency_contact_phone')
    ALTER TABLE [dbo].[persons] ADD [emergency_contact_phone] NVARCHAR(50) NULL;

-- Add columns to attendees table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'arrival_date')
    ALTER TABLE [dbo].[attendees] ADD [arrival_date] DATE NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'departure_date')
    ALTER TABLE [dbo].[attendees] ADD [departure_date] DATE NULL;
