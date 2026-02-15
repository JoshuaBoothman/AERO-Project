# Lock New Registrations Until Launch

## Goal
Restrict new user registrations until **Thursday 19th February 2026 at 4:00 PM AEST (Queensland Time)**. This affects the Login page ("Create Account" button), the Registration page, and the automated emails sent to legacy campsite booking holders.

## User Review Required
> [!IMPORTANT]
> **Database Change Required**: This plan relies on a new column `registration_lock_until` in the `organization_settings` table.
> Please run the following SQL script in SSMS **before** we implement the code changes.

### Proposed SQL Script
```sql
-- 1. Add the column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('organization_settings') AND name = 'registration_lock_until')
BEGIN
    ALTER TABLE organization_settings ADD registration_lock_until DATETIMEOFFSET NULL;
END

-- 2. Set the lock date (19th Feb 2026, 4:00 PM AEST = UTC+10)
-- AEST is UTC+10 (No Daylight Savings in QLD)
UPDATE organization_settings 
SET registration_lock_until = '2026-02-19 16:00:00 +10:00';

-- To verify:
-- SELECT registration_lock_until FROM organization_settings;
-- To unlock manually later (if needed earlier), set to NULL or a past date.
UPDATE organization_settings SET registration_lock_until = NULL; 
```

## Proposed Changes

### Database
*   **[MODIFY] `organization_settings`**: Added `registration_lock_until` column (via SQL script above).

### API
#### [MODIFY] [authRegister.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authRegister.js)
*   **Logic**:
    1.  Fetch `organization_settings`.
    2.  Check if `registration_lock_until` is set.
    3.  Compare current server time with lock date.
    4.  If `NOW < LOCK_DATE`, return `403 Forbidden` with the message: "Registrations are closed until Thursday 19th Feb at 4pm QLD time."

#### [MODIFY] [emailService.js](file:///c:/laragon/www/AERO-Project/api/src/lib/emailService.js)
*   **Function**: `sendLegacyWelcomeEmail`
*   **Update**: Modify the email body HTML.
*   **Content**: Add a prominent warning:
    > "Please note: The website will not be live for new registrations until **Thursday 19th February at 4:00 PM (QLD Time)**. Please do not attempt to claim your account until that time."
*   **Link**: The link will still point to the registration page, but the page itself will be locked (see below).

### Frontend
#### [MODIFY] [Login.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Login.jsx)
*   **Logic**:
    *   On mount, fetch `/api/getOrganization` to retrieve settings.
    *   Store `lockDate` in state.
    *   Check `new Date() < new Date(lockDate)`.
*   **UI Changes**:
    *   **Above "Create Account" button**: Display a warning message box (styled orange/yellow).
        *   "New account registration opens on Thursday 19th Feb at 4:00 PM (QLD Time)."
    *   **"Create Account" button**: Set `disabled={isLocked}`. Change style to look disabled (greyed out).

#### [MODIFY] [Register.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Register.jsx)
*   **Logic**:
    *   Fetch `/api/getOrganization` on mount.
    *   Check lock status.
*   **UI Changes**:
    *   If locked:
        *   Hide the registration form inputs? Or just disable them?
        *   **Decision**: Show the inputs but disable them and the submit button.
        *   Show the same warning message at the top of the page.
        *   "Registrations are currently closed. Please return on Thursday 19th Feb at 4:00 PM QLD Time."

## Verification Plan

### Automated Tests
*   None planned for this temporary restriction.

### Manual Verification
1.  **Database Setup**:
    *   Run the SQL script.
    *   Verify column exists and has the correct date.
2.  **API Enforcment**:
    *   Try to send a POST request to `/api/authRegister` (using Postman or curl).
    *   Expect: `403 Forbidden` error.
3.  **Frontend - Login Page**:
    *   Navigate to `/login`.
    *   Verify "Create Account" button is disabled.
    *   Verify the warning message appears and displays the correct time.
4.  **Frontend - Register Page**:
    *   Navigate to `/register`.
    *   Verify form is disabled/blocked.
    *   Verify warning message is visible.
5.  **Legacy Email**:
    *   Trigger a legacy import (or rely on code review of the template).
    *   Verify the email body contains the new warning text.
6.  **Unlock Test (Simulated)**:
    *   Update DB date to 1 hour ago (`UPDATE organization_settings SET registration_lock_until = DATEADD(hour, -1, SYSDATETIMEOFFSET())`).
    *   Verify Register button becomes active.
    *   Verify Registration works.
    *   **Revert** date to target time after testing.
