# Walkthrough - Attendee Phone Number

I have successfully implemented the collection of phone numbers for attendees.

## Changes

### Database
-  Verified `persons` table schema.
-  **User Action Required**: Run `docs/schema/20260122_add_phone_number.sql` (Confirmed as Done).

### Host/Frontend (Client)
- **File**: `client/src/components/AttendeeModal.jsx`
- **Changes**: 
    - Added `Phone Number` input field.
    - Added `phoneNumber` to state and validation logic.
    - Pre-fills with User's phone number if available.

### Backend (API)
- **File**: `api/src/functions/createOrder.js`
- **Changes**:
    - Updated `INSERT` and `UPDATE` queries for `persons` table to include `phone_number`.
    - Handles both Main User and Guest Attendees.
- **File**: `api/src/functions/updateAttendee.js`
- **Status**: Already supported `phone_number` updates.

## Verification
1.  **Registration**: When registering for an event, the "Attendee Details" modal now asks for a Phone Number.
2.  **Validation**: The field is required.
3.  **Persistence**: The data is saved to the `persons` table in the database upon checkout.
