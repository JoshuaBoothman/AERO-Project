-- Schema Discovery Script
-- Run this to understand the table structure for persons, attendees, and event_ticket_types

PRINT '=== PERSONS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'persons'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=== ATTENDEES TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'attendees'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=== EVENT_TICKET_TYPES TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'event_ticket_types'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=== SUBEVENTS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'subevents'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=== FOREIGN KEY RELATIONSHIPS ===';
SELECT 
    fk.name AS ForeignKey,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) IN ('attendees', 'persons')
   OR OBJECT_NAME(fk.referenced_object_id) IN ('attendees', 'persons')
ORDER BY TableName, ColumnName;

PRINT '';
PRINT '=== SAMPLE ATTENDEE DATA ===';
SELECT TOP 3
    a.attendee_id,
    a.event_id,
    a.person_id,
    a.ticket_type_id,
    a.status,
    a.flight_line_duties,
    a.arrival_date,
    a.departure_date
FROM attendees a
WHERE a.flight_line_duties = 1;
