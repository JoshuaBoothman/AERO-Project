IF NOT EXISTS (
    SELECT * 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[persons]') 
    AND name = 'country'
)
BEGIN
    ALTER TABLE [dbo].[persons]
    ADD [country] NVARCHAR(100) NULL DEFAULT 'Australia';
    
    PRINT 'Column [country] added to table [persons].';
END
ELSE
BEGIN
    PRINT 'Column [country] already exists in table [persons].';
END
GO
