
-- Add Bank Details columns to organization_settings table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'bank_name')
BEGIN
    ALTER TABLE organization_settings ADD bank_name NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'bank_account_name')
BEGIN
    ALTER TABLE organization_settings ADD bank_account_name NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'bank_bsb')
BEGIN
    ALTER TABLE organization_settings ADD bank_bsb NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'bank_account_number')
BEGIN
    ALTER TABLE organization_settings ADD bank_account_number NVARCHAR(50) NULL;
END

-- Verify columns
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'organization_settings';
