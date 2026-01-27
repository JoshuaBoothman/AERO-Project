# Air Show Registration Updates

## User Request


Change the wording on the front page from "Air Show Registration" to "Air Show Registration (Public Attendance)". Add a new checkbox to the modal that pops up when registering for an air show that asks "Would you like to be notified of future air shows". By checking this button the user is agreeing to receiving emails from us.

This plan outlines the changes required to update the Air Show Registration page title and add an email subscription option to the registration form.

## User Review Required

> [!IMPORTANT]
> **Database Change Required**: This plan requires a schema change to the `public_registrations` table. Please run the SQL script provided below before approving the plan for implementation.

## Proposed SQL Script

Please run the following T-SQL script in SSMS to add the `subscribe_to_emails` column:

```sql
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'public_registrations' AND COLUMN_NAME = 'subscribe_to_emails')
BEGIN
    ALTER TABLE public_registrations
    ADD subscribe_to_emails BIT DEFAULT 0 WITH VALUES;
END
GO
```

## Logic Explanation

1.  **Frontend Update**:
    *   The "Air Show Registration" title on the Event Details page will be updated to be more descriptive.
    *   A new checkbox will be added to the `PublicRegistrationModal`. This state will be managed in the `formData` object.
    *   When the form is submitted, the value of this checkbox (true/false) will be sent to the backend as `subscribeToEmails`.

2.  **Backend Update**:
    *   The `publicRegistration` Azure Function will be updated to extract `subscribeToEmails` from the request body.
    *   The SQL INSERT statement will be updated to include the `subscribe_to_emails` column.
    *   The value will be stored as `1` (true) or `0` (false).

## Proposed Changes

### Client

#### [MODIFY] [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
*   **Change**: Update the section header text.
*   **From**: "Air Show Registration"
*   **To**: "Air Show Registration (Public Attendance)"

#### [MODIFY] [PublicRegistrationModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Public/PublicRegistrationModal.jsx)
*   **Change**: Add a checkbox input field for email subscription.
*   **Location**: Below the "Adults" and "Children" fields, before the submit button.
*   **Logic**:
    *   Add `subscribeToEmails: false` to initial `formData` state.
    *   Add checkbox input bound to `formData.subscribeToEmails`.
    *   Label: "Would you like to be notified of future air shows"
    *   Pass `subscribeToEmails` in the API payload.

### API

#### [MODIFY] [publicRegistration.js](file:///c:/laragon/www/AERO-Project/api/src/functions/publicRegistration.js)
*   **Change**: Update the SQL INSERT query.
*   **Logic**:
    *   Destructure `subscribeToEmails` from the request body.
    *   Default to `false` if missing.
    *   Add `subscribe_to_emails` to the columns list.
    *   Add `@subscribe` parameter to the value list.

## Verification Plan

### Manual Verification
1.  **Frontend**:
    *   Navigate to the Air Show event page.
    *   Verify the title reads "Air Show Registration (Public Attendance)".
    *   Click "Register for Air Show".
    *   Verify the modal appears with the new checkbox.
    *   Fill out the form and **check** the box.
    *   Submit registration.
    *   Verify success message.

2.  **Database**:
    *   Run a query `SELECT TOP 1 * FROM public_registrations ORDER BY created_at DESC`.
    *   Verify that `subscribe_to_emails` is `1` for the new record.
    *   Repeat process **without** checking the box and verify it is `0`.
