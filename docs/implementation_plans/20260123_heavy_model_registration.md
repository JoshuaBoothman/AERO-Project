# Heavy Model Inspector Registration Logic

## Goal Description
Implement a new conditional check in the Registration Flow (and Attendee Management) to identify "Heavy Model Inspectors". If a user identifies as an inspector, they should not be required (or allowed) to register planes.

## User Review Required
> [!IMPORTANT]
> This change hides the "Planes" section entirely for Inspectors. Verify if they should still be *allowed* to bring planes if they want to, or if it's mutually exclusive. Currently assuming mutually exclusive based on "hidden and they can continue without adding planes".

## Proposed Changes

### Database
#### [MODIFY] `20260123_add_inspector_flag.sql` (New Script)
- Add `is_heavy_model_inspector` BIT column to `attendees` (or `persons`) table.
- Default to 0.

### Backend [API]
#### [MODIFY] `createOrder.js`
- Accept `is_heavy_model_inspector` in the attendee payload.
- Persist this flag to the database.
- Skip validation for "Planes Requirement" if this flag is true (if such validation exists).

#### [MODIFY] `updateAttendee.js`
- Allow updating `is_heavy_model_inspector`.

#### [MODIFY] `getOrderDetail.js`
- Return the `is_heavy_model_inspector` flag.

### Frontend [Client]
#### [MODIFY] `AttendeeModal.jsx`
- Add "Are you a heavy model inspector?" Dropdown (Yes/No) below the "Are you bringing any heavy models?" question.
- Logic:
    - Default to "No".
    - If "Yes": Hide the "Planes" section/button.
    - If "No": Show strict logic for heavy models as before.

#### [MODIFY] `OrderDetail.jsx`
- Show "Inspector" status in the attendee details if true.

## Verification Plan

### Manual Verification
1.  **Registration Flow**:
    - Go to Event Details -> Get Tickets.
    - Select a Ticket -> Checkout.
    - In `AttendeeModal`:
        - Select "No" for Inspector -> Verify Planes section is visible (if applicable).
        - Select "Yes" for Inspector -> Verify Planes section disappears.
    - Complete Order.
2.  **Order Details**:
    - Go to "My Orders".
    - Verify the "Inspector" flag is persisted and visible.
3.  **Edit Mode**:
    - Edit the attendee -> Change Inspector to "No" -> Verify Planes section reappears.
