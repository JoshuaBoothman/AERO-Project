
### 2026-02-08: Ticket Allocation Subevent Fixes
- **Goal**: Resolve "Mystery Guest" profile overwrites and Subevent assignment mix-ups.
- **Changes**:
  - `AttendeeModal.jsx`: Removed default auto-fill of user email for all attendees. Added "I am this attendee" button. Implemented validation to block using own email for guests.
  - `SubeventModal.jsx`: Fixed logic to list ALL attendees in a cart item (not just index 0) and display dates for clarity.
  - `createOrder.js`: Added backend safety guard to reject orders where Profile Name vs Email significantly mismatches.
  - `authLogin.js`: Updated to return user email in login response for better client-side validation.
- **Status**: Completed & Verified.
