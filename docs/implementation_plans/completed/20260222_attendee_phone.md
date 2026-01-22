# Attendee Phone Number

## Goal Description
Collect optional/required phone numbers for every attendee during registration to ensure organizers can contact them if needed.

## SQL Script
> [!NOTE]
> Run `docs/schema/20260122_add_phone_number.sql` to ensure the column exists.

## Proposed Changes

### Frontend (Client)
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/public/AttendeeModal.jsx)
-   Add "Phone Number" input field for each attendee.
-   Pre-fill if the attendee matches the current logged-in user.
-   Make it required (as per user request "compulsory field").

### Backend (API)
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   Ensure that when `createOrder` processes the `attendees` array, it extracts `phone_number`.
-   Update the corresponding `persons` record with this phone number.
    -   *Logic Check*: If person already has a phone number, do we overwrite it? Yes, assume latest input is most current.

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
-   Allow updating phone number post-registration.

## Verification Plan
### Manual Verification
1.  **Registration**: Register a new guest. Enter phone number.
2.  **My Orders**: View the order. Verify phone number is shown/editable.
3.  **Database**: Check `persons` table to see if phone number was saved.
