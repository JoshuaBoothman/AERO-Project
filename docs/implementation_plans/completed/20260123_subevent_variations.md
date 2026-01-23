# Subevent Variations Implementation Plan

## Goal Description
Allow subevents (e.g., "Steak Night") to have configurable variations (e.g., "Cook Time: Rare, Medium") that users must select upon registration. This brings subevent functionality closer to merchandise variations.

## User Review Required
> [!IMPORTANT]
> **Schema Changes**: New tables `subevent_variations`, `subevent_variation_options`, and `subevent_registration_choices` will be added.
> A SQL script `docs/updates/subevent_variations.sql` will be provided for manual execution.

## Proposed Changes

### Database Schema
#### [NEW] `subevent_variations`
- Defines the variation category (e.g., "Cook Time").
- Columns: `subevent_variation_id` (PK), `subevent_id` (FK), `name`.

#### [NEW] `subevent_variation_options`
- Defines the specific choices (e.g., "Rare").
- Columns: `variation_option_id` (PK), `subevent_variation_id` (FK), `name`.

#### [NEW] `subevent_registration_choices`
- Links a user's registration to their selected choice.
- Columns: `registration_choice_id` (PK), `subevent_registration_id` (FK), `variation_option_id` (FK).

### API
#### `getStoreItems.js`
- Update query to fetch `variations` and `options` for each subevent.
- Nest them within the `subevents` array in the response.

#### `createOrder.js`
- Update request validation to ensure required variations are selected.
- Insert selected choices into `subevent_registration_choices` during order creation.

### Frontend
#### [NEW] `client/src/components/SubeventModal.jsx`
- Validates user selection (required variations).
- Displays dropdowns/radios for each variation.

#### `client/src/pages/StorePage.jsx`
- Replace direct "Register" button logic with opening `SubeventModal`.
- Pass selected options to `addToCart`.

#### `client/src/pages/Checkout.jsx`
- Display selected options in the cart summary.

#### [NEW] Database Update Script
- `docs/updates/subevent_variations.sql` containing the DDL for new tables.

## Verification Plan

### Manual Verification
1.  **Admin Setup**: Manually insert test variations into the database (using the script).
2.  **User Flow**:
    - Go to Store Page.
    - Click "Register" on a Subevent with variations.
    - Verify Modal appears with options.
    - Verify "Add to Cart" is disabled until options are selected.
    - Add to Cart -> Verify Cart shows selected options.
    - Checkout -> Verify Order is successful.
    - Check Database -> Verify `subevent_registration_choices` are populated correctly.

### Automated Tests
- None currently (Manual verification preferred for this visual/flow change).

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
