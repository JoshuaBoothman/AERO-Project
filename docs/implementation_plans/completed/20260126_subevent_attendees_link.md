# Subevent Attendees Link

## Goal
To allow users to specify which attendee a subevent registration is for during the purchase process. This involves adding an `attendee_id` to the `subevent_registrations` table and updating the frontend to prompt for attendee selection.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: This plan requires running a SQL script to add `attendee_id` to `subevent_registrations`. The script will be provided.

## Technical Explanation (Current vs Future State)
Currently, `createOrder.js` automatically assigns all subevent registrations to a "Main Attendee". This Main Attendee is determined by picking the first ticket buyer in the current order, or finding a single existing attendee record for the user. Logic:
```javascript
// Current Logic (Simplified)
let mainAttendeeId = allAttendeeIds[0] || existingAttendeeId;
// ...
INSERT INTO order_items (attendee_id, ...) VALUES (mainAttendeeId, ...);
```
Crucially, `subevent_registrations` has NO link to an attendee, forcing the system to rely on the `order_items.attendee_id`, which is currently defaulted to this "Main" person.

**After Implementation:**
1.  **Frontend**: The cart will carry a specific `attendeeId` (for existing pilots) or `tempId` (for new tickets in cart) for EACH subevent item.
2.  **Schema**: `subevent_registrations` gets an `attendee_id` column.
3.  **Backend**: `createOrder.js` will resolve the specific attendee for each subevent loop iteration.
    ```javascript
    // Future Logic
    let specificAttendeeId = resolveAttendee(subevent.attendeeIdentifier); 
    INSERT INTO order_items (attendee_id, ...) VALUES (specificAttendeeId, ...);
    INSERT INTO subevent_registrations (attendee_id, ...) VALUES (specificAttendeeId, ...);
    ```
This ensures that if a user buys 3 subevent tickets, they can be assigned to 3 different people explicitly.

## Proposed Changes

### Database
#### [NEW] `api/scripts/manual_20260126_subevent_attendee.sql`
- Script to add `attendee_id` column to `subevent_registrations`.
- Update `api/scripts/ensure_schema_minimal.js` to reflect this change for future deployments.

### API
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Update validation logic to ensure a valid `attendeeId` or `tempId` is provided for subevents.
- Logic to resolve `attendeeTempId` (from cart tickets) to real `attendeeId` (created in transaction).
- Insert `attendee_id` into `subevent_registrations` table.
- Ensure `order_items` entry for the subevent is also linked to the correct `attendee_id` (instead of default Main User).

### Frontend
#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Update `handleAddSubevent` to **always** open `SubeventModal`, even if no variations exist, to allow Attendee selection.
- Pass `myPilots` (existing attendees) and `cart` (tickets in cart) to `SubeventModal`.

#### [MODIFY] [SubeventModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/SubeventModal.jsx)
- **New Feature**: Attendee Selection Dropdown.
- Logic to aggregate "Available Attendees":
    - Existing Attendees (`myPilots`).
    - New Tickets in Cart (identified by `tempId` or index).
- Validation: User must select an attendee.
- Pass selected `attendeeId` (or `tempId`) to parent on confirm.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1.  **Database**:
    - Run the provided SQL script.
    - Verify column exists: `SELECT * FROM subevent_registrations`.
2.  **Frontend (Store)**:
    - Log in as a user with NO tickets.
        - Verify Subevents tab is locked (existing behavior).
    - Add a Ticket to Cart.
        - Verify Subevents tab unlocks.
    - Click "Register" on a Subevent.
        - **Verify Modal opens** (even if no variations).
        - **Verify Dropdown** shows "New Ticket (Name/Type)".
        - Select the ticket. Add to Cart.
    - Add a second Ticket for a different person (e.g., "Child").
    - Register another Subevent.
        - Verify Dropdown shows both options.
        - Select the second ticket.
3.  **Checkout**:
    - Complete purchase.
4.  **Backend/DB Verification**:
    - Check `orders`, `order_items`.
    - Check `subevent_registrations`:
        - Verify `attendee_id` is populated correctly for each row.
        - Verify it matches the `attendee_id` linked to the corresponding ticket in `attendees` table.
