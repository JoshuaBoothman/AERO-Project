-- Protocol for Subevent Variations Schema Update

-- 1. Create table for Variation Categories (e.g. "Cook Time")
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[subevent_variations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[subevent_variations](
        [subevent_variation_id] [int] IDENTITY(1,1) NOT NULL,
        [subevent_id] [int] NOT NULL,
        [name] [nvarchar](255) NOT NULL,
        [is_required] [bit] DEFAULT 1,
        CONSTRAINT [PK_subevent_variations] PRIMARY KEY CLUSTERED ([subevent_variation_id] ASC)
    );
    
    ALTER TABLE [dbo].[subevent_variations]  WITH CHECK ADD  CONSTRAINT [FK_subevent_variations_subevents] FOREIGN KEY([subevent_id])
    REFERENCES [dbo].[subevents] ([subevent_id])
    ON DELETE CASCADE;
END;

-- 2. Create table for Variation Options (e.g. "Rare", "Medium")
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[subevent_variation_options]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[subevent_variation_options](
        [variation_option_id] [int] IDENTITY(1,1) NOT NULL,
        [subevent_variation_id] [int] NOT NULL,
        [name] [nvarchar](255) NOT NULL,
        [price_adjustment] [decimal](10, 2) DEFAULT 0.00,
        CONSTRAINT [PK_subevent_variation_options] PRIMARY KEY CLUSTERED ([variation_option_id] ASC)
    );

    ALTER TABLE [dbo].[subevent_variation_options]  WITH CHECK ADD  CONSTRAINT [FK_subevent_variation_options_variations] FOREIGN KEY([subevent_variation_id])
    REFERENCES [dbo].[subevent_variations] ([subevent_variation_id])
    ON DELETE CASCADE;
END;

-- 3. Create table for User Choices
-- NOTE: This assumes 'subevent_registrations' has a primary key named 'subevent_registration_id'. 
-- If it is named 'id', please adjust the FK column and constraint below.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[subevent_registration_choices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[subevent_registration_choices](
        [registration_choice_id] [int] IDENTITY(1,1) NOT NULL,
        [subevent_registration_id] [int] NOT NULL, 
        [variation_option_id] [int] NOT NULL,
        CONSTRAINT [PK_subevent_registration_choices] PRIMARY KEY CLUSTERED ([registration_choice_id] ASC)
    );

    -- Foreign Key to Registration
    -- IMPORTANT: Verify the PK of subevent_registrations. Attempting to link to it:
    -- ALTER TABLE [dbo].[subevent_registration_choices]  WITH CHECK ADD  CONSTRAINT [FK_subevent_registration_choices_registrations] FOREIGN KEY([subevent_registration_id])
    -- REFERENCES [dbo].[subevent_registrations] ([subevent_registration_id]); -- UPDATE COLUMN NAME IF NEEDED
    
    -- Foreign Key to Option
    ALTER TABLE [dbo].[subevent_registration_choices]  WITH CHECK ADD  CONSTRAINT [FK_subevent_registration_choices_options] FOREIGN KEY([variation_option_id])
    REFERENCES [dbo].[subevent_variation_options] ([variation_option_id]);
END;
