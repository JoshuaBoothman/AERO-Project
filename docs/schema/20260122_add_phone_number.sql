-- Run on: sqldb-aero-dev AND sqldb-aero-master

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'persons' AND COLUMN_NAME = 'phone_number')
BEGIN
    ALTER TABLE persons ADD phone_number NVARCHAR(50) NULL;
    PRINT 'Added phone_number column to persons table.';
END
ELSE
BEGIN
    PRINT 'phone_number column already exists in persons table.';
END
