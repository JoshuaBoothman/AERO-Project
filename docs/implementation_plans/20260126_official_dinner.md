# Official Dinner Date & RSVP

Add functionality to manage an "Official Dinner Date" on events and allow attendees to RSVP ("Attending Dinner") during registration.

## User Review Required

> [!NOTE]
> The 'Attending Dinner' field is a simple checkbox (Yes/No).
> It defaults to `0` (No).

> [!IMPORTANT]
> **Manual Database Update Required**: The user will manually run the SQL script below to update the database schema BEFORE code implementation begins.

## Proposed Changes

### Database

#### [NEW] [SQL Script](file:///c:/laragon/www/AERO-Project/api/sql/20260126_official_dinner.sql)
The following SQL script has been created for you to run:

```sql
USE [AERO_Project];
GO

-- Add Official Dinner Date to Events table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[events]') AND name = 'dinner_date')
BEGIN
    ALTER TABLE [dbo].[events] ADD [dinner_date] DATETIME NULL;
    PRINT 'Added dinner_date column to events table.';
END
ELSE
BEGIN
    PRINT 'dinner_date column already exists in events table.';
END
GO

-- Add Attending Dinner flag to Attendees table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'attending_dinner')
BEGIN
    ALTER TABLE [dbo].[attendees] ADD [attending_dinner] BIT NOT NULL DEFAULT 0;
    PRINT 'Added attending_dinner column to attendees table.';
END
ELSE
BEGIN
    PRINT 'attending_dinner column already exists in attendees table.';
END
GO
```

### Backend (API)

#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
- Include `dinner_date` in the selected columns.

#### [MODIFY] [createEvent.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createEvent.js)
- Accept `dinner_date` from request body and insert into `events`.

#### [MODIFY] [updateEvent.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateEvent.js)
- Accept `dinner_date` from request body and update `events`.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- When capturing attendee details, save `attending_dinner`.

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
- Allow updating `attending_dinner`.

#### [MODIFY] [getUserEventAttendees.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getUserEventAttendees.js)
- Select `attending_dinner` in the output so it populates the modal when editing.

### Frontend (Client)

#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- Add "Official Dinner Date" `datetime-local` input field.
- Place it below the "Start Date" and "End Date" section.
- Map to `formData.dinner_date`.

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- Add "Will you be attending the official dinner...?" checkbox.
- Place it above "Dietary Requirements".
- Label should dynamically show the formatted date: `event.dinner_date` in Long Date format (e.g., Friday 10th July 2026).
- Only show this field if `event.dinner_date` is set.

## Verification Plan

### Automated Tests
- None planned for this feature.

### Manual Verification
1.  **DB**: Run SQL script and verify columns exist.
2.  **Admin**:
    - Go to "New Event" or "Edit Event".
    - Set "Official Dinner Date".
    - Save and reload to verify persistence.
3.  **User Registration**:
    - Go to Store/Event Page.
    - Add ticket to cart.
    - Open "Attendee Details" modal.
    - Ensure checkbox appears with correct date.
    - Check the box and complete order.
    - Verify in DB `attendees` table that `attending_dinner` is 1.
4.  **Edit Attendee**:
    - Go to "My Events".
    - Edit an attendee.
    - Change the checkbox value.
    - Save.
    - Reload and verify persistence.
