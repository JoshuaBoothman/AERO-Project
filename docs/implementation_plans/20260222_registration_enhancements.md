# Registration & Attendee Data Enhancements

## Goal Description
Capture additional details during event registration including Shirt Size/Color/Gender (for included shirts), Dietary Preferences (for dinners), Phone Numbers, and explicit Pilot questions for Pit Crew.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Need to store "Shirt Details" for attendees. Recommendation: Add local columns to `attendees` table (e.g., `shirt_size`, `shirt_gender`) OR a JSON column `metadata`. Given the requirement for "Size/Colour/Men or Women", separate columns are cleaner for reporting.

## Proposed Changes

### Database
- Add columns to `attendees` table:
    - `phone_number` (nvarchar 50) - *Note: `persons` has phone, but `attendees` allows capturing it per event/ticket if different or for guests.* Actually, `persons` is the source of truth, but we need to ensure we capture it in the `AttendeeModal` and save it to `persons`.
    - `shirt_size` (varchar 50)
    - `shirt_color` (varchar 50)
    - `shirt_gender` (varchar 20) (Mens/Womens)

### Backend (API)
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Update `createOrder` to accept and save new fields for each attendee.
- Ensure `phone_number` updates the linked `persons` record if provided.

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
- Allow updating shirt details and dietary info.

### Frontend (Client)
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/public/AttendeeModal.jsx)
- **Phone Number**: Add input field.
- **Shirt Selection**: Add "Shirt Included" logic (based on ticket type?).
    - Prompt for: Size (S-5XL), Gender (M/F), Color (if applicable, or fixed).
- **Dietary Requirements**: Add Textarea/Input.
- **Pit Crew Question**: "Who is the pilot you will be accompanying?"
    - Existing logic handles the "Link," but UI needs to frame it as this specific question for Pit Crew tickets.

## Verification Plan
### Manual Verification
1.  **Registration Flow**: Buy a Pilot + Pit Crew ticket. verify Modal asks for Phone, Shirt (for Pilot), and Pilot Name (for Pit Crew).
2.  **Data Persistence**: Check Database `attendees` table for saved shirt sizes.
3.  **My Orders**: Verify details are visible/editable in Order Details.
