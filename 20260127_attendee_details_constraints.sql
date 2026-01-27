-- SQL Script to Enforce NOT NULL Constraints on Persons Table
-- Run this script in SSMS to update the database schema.

BEGIN TRANSACTION;

-- Update existing NULL values to empty strings or defaults to prevent errors when applying NOT NULL constraint
UPDATE persons SET address_line_1 = '' WHERE address_line_1 IS NULL;
UPDATE persons SET city = '' WHERE city IS NULL;
UPDATE persons SET state = '' WHERE state IS NULL;
UPDATE persons SET postcode = '' WHERE postcode IS NULL;
UPDATE persons SET country = 'Australia' WHERE country IS NULL;
UPDATE persons SET emergency_contact_name = '' WHERE emergency_contact_name IS NULL;
UPDATE persons SET emergency_contact_phone = '' WHERE emergency_contact_phone IS NULL;

-- Apply NOT NULL constraints
ALTER TABLE persons ALTER COLUMN address_line_1 NVARCHAR(255) NOT NULL;
ALTER TABLE persons ALTER COLUMN city NVARCHAR(100) NOT NULL;
ALTER TABLE persons ALTER COLUMN state NVARCHAR(50) NOT NULL;
ALTER TABLE persons ALTER COLUMN postcode NVARCHAR(20) NOT NULL;
ALTER TABLE persons ALTER COLUMN country NVARCHAR(100) NOT NULL;
ALTER TABLE persons ALTER COLUMN emergency_contact_name NVARCHAR(255) NOT NULL;
ALTER TABLE persons ALTER COLUMN emergency_contact_phone NVARCHAR(50) NOT NULL;

COMMIT TRANSACTION;

PRINT 'Persons table updated successfully with NOT NULL constraints.';
