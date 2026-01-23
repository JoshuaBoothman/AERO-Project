/*
    Schema Update: Invoice & Part Payments
    Date: 2026-01-23
    Description: Adds columns for Invoice #, Payment Tracking, and Organization Address.
*/

USE [AERO_Project];
GO

-- 1. Update ORDERS table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'invoice_number')
BEGIN
    ALTER TABLE orders ADD invoice_number VARCHAR(20) NULL;
    PRINT 'Added invoice_number to orders';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'amount_paid')
BEGIN
    ALTER TABLE orders ADD amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
    PRINT 'Added amount_paid to orders';
END
GO

-- 2. Update TRANSACTIONS table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transactions' AND COLUMN_NAME = 'reference')
BEGIN
    ALTER TABLE transactions ADD reference VARCHAR(100) NULL;
    PRINT 'Added reference to transactions';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transactions' AND COLUMN_NAME = 'payment_date')
BEGIN
    ALTER TABLE transactions ADD payment_date DATETIME NULL;
    PRINT 'Added payment_date to transactions';
END
GO

-- 3. Update ORGANIZATION_SETTINGS table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'address_line_1')
BEGIN
    ALTER TABLE organization_settings ADD address_line_1 NVARCHAR(255) NULL;
    PRINT 'Added address_line_1 to organization_settings';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'city')
BEGIN
    ALTER TABLE organization_settings ADD city NVARCHAR(100) NULL;
    PRINT 'Added city to organization_settings';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'state')
BEGIN
    ALTER TABLE organization_settings ADD state NVARCHAR(50) NULL;
    PRINT 'Added state to organization_settings';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'postcode')
BEGIN
    ALTER TABLE organization_settings ADD postcode NVARCHAR(20) NULL;
    PRINT 'Added postcode to organization_settings';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organization_settings' AND COLUMN_NAME = 'phone_number')
BEGIN
    ALTER TABLE organization_settings ADD phone_number VARCHAR(50) NULL;
    PRINT 'Added phone_number to organization_settings';
END
GO

PRINT 'Schema update completed successfully.';
