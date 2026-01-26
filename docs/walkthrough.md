# Walkthrough: Subevent Attendee Linking

I have implemented the logic to link Subevents to specific Attendees.

## Changes

### Schema link
- [x] **Database**: Added `attendee_id` to `subevent_registrations`. (Confirmed by you)
- [x] **Script**: `api/scripts/ensure_schema_minimal.js` updated to reflect this change.

### Backend
- [x] **[createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)**: 
    - Added logic to populate `tempIdMap` from tickets in the cart.
    - Added logic to resolve `subevent.attendeeId` or `subevent.attendeeTempId` to a real `attendee_id` during transaction.
    - Updated `INSERT` statements for `order_items` and `subevent_registrations` to include the specific `attendee_id`.

### Frontend
- [x] **[StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)**:
    - Automatically generates a unique `tempId` for every ticket added to the cart to ensure it can be tracked.
    - Updated `handleAddSubevent` to **always** open the `SubeventModal` (instead of skipping it if no variations exist).
    - Passes `myPilots` (existing attendees) and `cart` (new tickets) to the modal.
- [x] **[SubeventModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/SubeventModal.jsx)**:
    - Added a "Who is this for?" dropdown.
    - Aggregates "Existing Attendees" and "New Tickets in Cart" into a selectable list.
    - Validates that an attendee is selected before allowing "Add to Cart".

## Verification Tests

Please perform the following manual tests:

1.  **New Ticket + Subevent**:
    - Go to the Store.
    - Add an "Adult Ticket - Pilot" to the cart.
    - Click "Register" on a Subevent.
    - **Expectation**: The modal opens, and you can select "New Ticket: [Name]" from the dropdown.
    - Add to Cart and Checkout.
    - **Verify DB**: Check `subevent_registrations` has a valid `attendee_id` matching the new pilot.

2.  **No Ticket Checks**:
    - Remove all tickets from cart.
    - Try to register for a Subevent.
    - **Expectation**: The modal warns "No attendees found" (if you have no existing attendees), or allows selection of existing attendees only.

3.  **Multiple People**:
    - Add Ticket A (Pilot) and Ticket B (Helper).
    - Register Subevent 1 -> Select Ticket A.
    - Register Subevent 2 -> Select Ticket B.
    - Checkout.
    - **Verify DB**: Two registrations, linked to different `attendee_id`s.
