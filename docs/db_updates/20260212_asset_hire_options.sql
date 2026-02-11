-- ============================================================
-- Asset Hire Options - Schema Changes
-- Date: 2026-02-12
-- INSTRUCTIONS: Run this script on BOTH 'sqldb-aero-dev' AND 'sqldb-aero-master'.
-- ============================================================

-- 1. Create the options lookup table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'asset_type_options')
BEGIN
    CREATE TABLE asset_type_options (
        asset_type_option_id INT IDENTITY(1,1) PRIMARY KEY,
        asset_type_id        INT NOT NULL,
        label                NVARCHAR(100) NOT NULL,
        sort_order           INT NOT NULL DEFAULT 0,
        is_active            BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_asset_type_options_type
            FOREIGN KEY (asset_type_id) REFERENCES asset_types(asset_type_id)
            ON DELETE CASCADE
    );
    PRINT 'Created table asset_type_options';
END
ELSE
BEGIN
    PRINT 'Table asset_type_options already exists';
END
GO

-- 2. Add option_label column to asset_types (admin-controlled dropdown heading)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'asset_types' AND COLUMN_NAME = 'option_label'
)
BEGIN
    ALTER TABLE asset_types
    ADD option_label NVARCHAR(50) NULL;
    PRINT 'Added column option_label to asset_types';
END
ELSE
BEGIN
    PRINT 'Column option_label already exists in asset_types';
END
GO

-- 3. Add selected_option_id to asset_hires (stores the hirer's choice)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'asset_hires' AND COLUMN_NAME = 'selected_option_id'
)
BEGIN
    ALTER TABLE asset_hires
    ADD selected_option_id INT NULL;

    ALTER TABLE asset_hires
    ADD CONSTRAINT FK_asset_hires_option
        FOREIGN KEY (selected_option_id) REFERENCES asset_type_options(asset_type_option_id);
    PRINT 'Added column selected_option_id to asset_hires and foreign key constraint';
END
ELSE
BEGIN
    PRINT 'Column selected_option_id already exists in asset_hires';
END
GO
