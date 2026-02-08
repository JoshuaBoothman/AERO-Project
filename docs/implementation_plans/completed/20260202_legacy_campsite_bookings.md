# Legacy Priority Booking Implementation

## Goal
Allow admins to manually reserve campsites for previous attendees who have not yet registered on the new system. When these attendees register and verify their email, the system should automatically link them to their existing booking.

## User Review Required
> [!NOTE]
> No database schema changes, but relies on `persons.user_id` being NULLable (which it is) and strict transactional logic in `createOrder`.

## Proposed Changes

### Admin Tool (Frontend & API)
#### [NEW] [AdminLegacyImport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminLegacyImport.jsx)
(Refined: To be triggered from `AdminMapTool.jsx`)

#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)
*   **UI Update**: Add a "Returning Campers" / "Legacy Import" button to the control panel.
*   **Interaction**: Opens a Modal.
    *   **Attendee Details**: First Name, Last Name, Email.
    *   **Selection**: Select Campsite (can pre-fill if clicked on map).
    *   **Action**: "Create Reservation".

#### [NEW] [createLegacyBooking.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createLegacyBooking.js)
*   **Logic**:
    1.  Check if `users` exists with this email.
        *   If no, CREATE `users` (Email, Random Password, `is_email_verified=0`, `is_legacy_import=1`).
    2.  Check/Create `persons`.
    3.  Create `orders` record (Status: 'Pending', Source: 'Legacy').
    4.  Create `order_items` (Campsite).
    5.  Create `campsite_bookings` (Locking user availability).
    6.  Send Email to User: "Your campsite is reserved. Click here to claim."

### User Experience (The "Merge" Flow)
1.  User clicks link -> Sets Password -> Verifies Email.
2.  **Login**: User enters the site.
3.  **Store/Cart**: 
    *   Frontend (`CartContext`) checks for `orders` with `status='Pending'` and `source='Legacy'` for this user.
    *   If found, converts them into **Cart Items** (visual only).
    *   User sees "Campsite #XYZ" in their cart.
4.  **Checkout**: 
    *   User adds Tickets/Merch.
    *   User clicks "Pay".
    *   Payload includes the Legacy Campsite as a standard item.

### API Updates
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Transactional Merge Logic**:
    *   When processing `campsites`:
    *   **Availability Check**: If `is_booked` is TRUE:
        *   Check who booked it.
        *   **IF** Booked by `CURRENT_USER` AND Order Status is `Pending` (Legacy):
            *   **ALLOW** the operation.
            *   **DELETE** the old `campsite_bookings` row.
            *   **DELETE** the old `order_items` row.
            *   (Optional) Clean up old Order if empty.
    *   Proceed to insert the **NEW** `campsite_bookings` linked to the **NEW** Order.
    *   This ensures the campsite is never "free" to others, but moves seamlessly to the paid order.

#### [MODIFY] [authRegister.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authRegister.js)
*   Allow registration if email exists BUT `is_legacy_import = 1`.
*   Update password and verify account.

### Schema Changes
*   **[Recommended]**: Add `is_legacy_import` (BIT) to `users` table.

## Verification Plan
1.  **DB**: Add `is_legacy_import` column.
2.  **Admin Import**:
    *   Import "Dave Legacy" (dave@test.com) -> Assign Site 5.
    *   Verify `users` table has entry (Legacy=1).
    *   Verify Booking exists (Site 5 locked).
3.  **Registration Override**:
    *   Register as "dave@test.com".
    *   Verify success (Account claimed).
4.  **Checkout Merge**:
    *   Go to Store -> Add Ticket.
    *   Add Site 5 to Cart (or see it auto-added).
    *   Checkout.
    *   **Verify**: Old Booking deleted? New Booking created?
    *   **Verify**: Site 5 remains booked throughout.
