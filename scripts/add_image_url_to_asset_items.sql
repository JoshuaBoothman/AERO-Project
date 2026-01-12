IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('asset_items') 
    AND name = 'image_url'
)
BEGIN
    ALTER TABLE asset_items
    ADD image_url NVARCHAR(MAX) NULL;
END
GO
