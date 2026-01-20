-- Public Air Show Registration Tables

-- 1. Table to define the specific "Air Show" days (or other public sub-event days)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[public_event_days]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[public_event_days](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [event_id] [int] NOT NULL,
        [title] [nvarchar](255) NOT NULL,
        [description] [nvarchar](max) NULL,
        [date] [date] NOT NULL,
        [start_time] [time](7) NULL,
        [end_time] [time](7) NULL,
        [is_active] [bit] DEFAULT 1,
        CONSTRAINT [PK_public_event_days] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_public_event_days_events] FOREIGN KEY([event_id]) REFERENCES [dbo].[events] ([event_id])
    )
END
GO

-- 2. Table to store the public registrations (headcounts)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[public_registrations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[public_registrations](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [public_event_day_id] [int] NOT NULL,
        [first_name] [nvarchar](255) NOT NULL,
        [last_name] [nvarchar](255) NOT NULL,
        [email] [nvarchar](255) NOT NULL,
        [adults_count] [int] DEFAULT 1,
        [children_count] [int] DEFAULT 0,
        [ticket_code] [varchar](12) NULL,
        [created_at] [datetime] DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_public_registrations] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_public_registrations_public_event_days] FOREIGN KEY([public_event_day_id]) REFERENCES [dbo].[public_event_days] ([id])
    )
END
GO
