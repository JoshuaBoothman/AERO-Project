# Subevent Registration Updates

## Goal Description
Update the Subevent Registration workflow to allow users to search and select *any* registered attendee for the event (not just their own linked pilots) or enter a custom name for a guest who is not a registered attendee. This improves flexibility for purchasing tickets for dinners, workshops, or other subevents for friends/family who may not have a full event ticket.

## User Review Required
> [!IMPORTANT]
> **Database Changes Required**: This plan requires altering the `subevent_registrations` table to allow NULL `attendee_id` and store a `guest_name`. Existing queries relying on `attendee_id` being present may need updates (though standard LEFT JOINs should be safe).
>
> **Security Implication**: The new "Search Attendees" endpoint will allow any logged-in user to search the names of all attendees for the event. This is necessary for the feature but should be noted.

## Proposed Changes

### Database
#### [NEW] SQL Script
Create a SQL script to update the `subevent_registrations` table.
- Alter column `attendee_id` to be NULLable.
- Add column `guest_name` (NVarChar(255)).

### API
#### [NEW] [searchEventAttendees.js](file:///c:/laragon/www/AERO-Project/api/src/functions/searchEventAttendees.js)
Create a new endpoint to search basic attendee info.
- **Route**: `GET /events/{slug}/attendees/search?q={query}` (or similar)
- **Logic**:
    - Validate User.
    - Search `attendees` joined with `persons` by `first_name` or `last_name`.
    - Return `attendee_id`, `name`, `ticket_type`.
    - Limit results (e.g., top 20) to prevent scraping.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
Update the order processing logic for Subevents.
- accept `guestName` in the subevent item payload.
- If `attendeeId` is provided, use it.
- If `guestName` is provided and `attendeeId` is missing/null, insert into `subevent_registrations` with `guest_name`.

### Client
#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Implement `searchAttendees` function calling the new API.
- Pass this search function (or the logic to call it) to `SubeventModal`.
- Update `handleConfirmSubevent` to accept and process `guestName` from the modal.

#### [MODIFY] [SubeventModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/SubeventModal.jsx)
- **UI Update**: Replace the simple `<select>` with a **Combobox / Autocomplete** UI.
- **Behavior**:
    - Initial state: Empty input.
    - On Type: Debounce search via API.
    - Display results in a dropdown list.
    - **"New Guest" Option**: If the user types a name, allow them to select "Use '{name}' as Guest Name" (or a specific "New Name" input field if preferred, but a unified combobox is smoother).
    - Validation: Ensure either an Attendee is selected OR a Guest Name is entered.
- **Logic**:
    - Manage local state for `searchTerm`, `searchResults`, `selectedAttendee`, `guestName`.

## Proposed SQL Script
```sql
-- Run this in SSMS before deploying changes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subevent_registrations') AND name = 'guest_name')
BEGIN
    ALTER TABLE subevent_registrations ADD guest_name NVARCHAR(255) NULL;
END

-- Make attendee_id nullable
ALTER TABLE subevent_registrations ALTER COLUMN attendee_id INT NULL;
```

## Verification Plan

### Automated Tests
- No existing automated tests for specific UI flows.
- API Test: Use `curl` or Postman to test the new `searchEventAttendees` endpoint.
    - `curl -H "Authorization: Bearer <token>" "http://localhost:7071/api/events/airshow-2026/attendees/search?q=John"`

### Manual Verification
1.  **Search Feature**:
    - Open the Subevent Modal.
    - Type "John".
    - Verify database attendees named "John" appear.
    - Select one and add to cart.
2.  **Guest Name Feature**:
    - Open Modal.
    - Type "Grandma Smith" (who is not in DB).
    - Select "Add 'Grandma Smith' as Guest".
    - Add to cart.
3.  **Checkout**:
    - Complete checkout.
    - Verify in Database (`subevent_registrations`) that the first record has `attendee_id` set, and the second has `guest_name` set with NULL `attendee_id`.
