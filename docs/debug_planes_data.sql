-- Debug Script for Planes Visibility
-- Run this in SSMS

DECLARE @UserID INT = 2; -- As specified by you

PRINT '=== 1. Check User Existence ===';
SELECT user_id, email, first_name, last_name 
FROM users 
WHERE user_id = @UserID;

PRINT '=== 2. Check Persons Linked to User ===';
-- The application queries planes via the persons table: JOIN persons p ON pl.person_id = p.person_id WHERE p.user_id = @uid
SELECT person_id, first_name, last_name, user_id
FROM persons 
WHERE user_id = @UserID;

PRINT '=== 3. Check Planes Linked to User Persons ===';
-- This is what the application query expects to find
SELECT 
    pl.plane_id,
    pl.person_id,
    pl.name AS plane_name,
    p.first_name AS pilot_name,
    p.user_id
FROM planes pl
JOIN persons p ON pl.person_id = p.person_id
WHERE p.user_id = @UserID;

PRINT '=== 4. Check ORPHANED Planes (Potential Issue) ===';
-- Are there planes that *look* like they belong to this user (by name) but are linked to a person ID that ISN'T linked to the user?
-- This often happens if a "Person" was created during checkout but failed to link to the User account.
SELECT top 100
    pl.plane_id,
    pl.name AS plane_name,
    pl.person_id,
    p.first_name,
    p.last_name,
    p.user_id AS person_user_id,
    'Orphaned?' = CASE WHEN p.user_id IS NULL THEN 'YES' ELSE 'NO' END
FROM planes pl
LEFT JOIN persons p ON pl.person_id = p.person_id
ORDER BY pl.plane_id DESC;

PRINT '=== 5. Schema Check (Columns) ===';
-- Verify the columns exist (though if API was 200 OK [], this isn't the issue, but good to check)
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'planes' AND COLUMN_NAME IN ('is_heavy_model', 'heavy_model_cert_number');
