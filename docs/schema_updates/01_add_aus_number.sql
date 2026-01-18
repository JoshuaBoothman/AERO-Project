-- SQL Script to add aus_number to users table
-- Run this on your local and live databases

-- 1. Add the column as NULLable first to prevent errors with existing data
ALTER TABLE users ADD aus_number NVARCHAR(50) NULL;
GO

-- 2. Update existing rows with a placeholder value (REQUIRED to make it NOT NULL later)
-- Using 'LEGACY-USER' or similar placeholder for existing test data
UPDATE users SET aus_number = 'LEGACY-TEMP' WHERE aus_number IS NULL;
GO

-- 3. Alter the column to be NOT NULL
ALTER TABLE users ALTER COLUMN aus_number NVARCHAR(50) NOT NULL;
GO
