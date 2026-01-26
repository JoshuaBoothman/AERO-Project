# Pit Crew Free Text Pilot Name

This plan outlines the changes required to allow Pit Crew tickets to be linked to a pilot via a free text name, instead of strictly requiring a link to a registered pilot attendee.

## User Review Required

> [!IMPORTANT]
> **Schema Change Required**: You must manually apply the following schema change before verifying the feature:
> ```sql
> ALTER TABLE attendees ADD pilot_name NVARCHAR(255) NULL;
> ```
> Please confirm when this has been applied.

## Proposed Changes

### Database
- **Schema**: Add `pilot_name` column to `attendees` table.

### Backend [API]
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Update input parsing to accept `pilotName` for attendees.
- Update `INSERT INTO attendees` statement to include `pilot_name`.
- Ensure logic allows `linked_pilot_attendee_id` to be null if `pilot_name` is provided for Pit Crew tickets.

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
- Update logic to allow updating `pilot_name`.
- Ensure properly handling of mutual exclusivity (if UI enforces it) just saving the field.

### Frontend [Client]
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- **Pit Crew Section**:
    - Add a way to switch between "Link to Registered Pilot" and "Enter Pilot Name Manually".
    - Implement a free text input for `pilotName`.
    - Update validation to require *either* a linked pilot *OR* a manual pilot name.
    - If "Manual" is selected, clear `linkedPilotAttendeeId` and `linkedPilotTempId`.

## Verification Plan

### Manual Verification
1.  **Start Application**: Run `npm run dev` in client and `npm start` in api.
2.  **Add to Cart**: Add a "Pit Crew" ticket to the cart.
3.  **Open Modal**: Proceed to checkout or click to edit attendee details.
4.  **Test Manual Entry**:
    - Select "Enter Pilot Name Manually" (or equivalent UI).
    - Type "Ghost Maverick".
    - Fill other required fields.
    - Confirm.
5.  **Submit Order**: Complete the "purchase" (Pay Later/Dummy).
6.  **Verify DB**: Check the `attendees` table for the new record. Ensure `pilot_name` is "Ghost Maverick" and `linked_pilot_attendee_id` is NULL.
7.  **Test Linked Entry**:
    - Repeat process but select an existing pilot.
    - Verify DB has valid `linked_pilot_attendee_id` and NULL `pilot_name`.
