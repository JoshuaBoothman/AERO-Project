IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[faqs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[faqs](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [event_id] [int] NULL, -- Nullable for global/organization level FAQs, or specific to an event
        [question] [nvarchar](max) NOT NULL,
        [answer] [nvarchar](max) NOT NULL,
        [image_url] [nvarchar](500) NULL,
        [display_order] [int] DEFAULT 0,
        [is_active] [bit] DEFAULT 1,
        [created_at] [datetime] DEFAULT GETDATE(),
        [updated_at] [datetime] DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END
GO
