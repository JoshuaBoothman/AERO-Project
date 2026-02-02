# Admin Attendees Ticket Type Dropdown Fix

**Goal**: Fix the "Ticket Type" search dropdown in the admin attendees list (`admin/attendees/`) which is currently not loading options.

## User Review Required
> [!IMPORTANT]
> This is a bug fix. No new interface elements are being added. The "new interface" will be the functional dropdown that was previously broken.

## Proposed Changes

### Logic Explanation
The issue is caused by a property name mismatch between the backend API and the frontend component.
- **Backend (`getEventDetail`)**: Returns ticket types in a property named `tickets`.
  ```javascript
  return {
      status: 200,
      jsonBody: {
          ...eventData,
          tickets: tickets, // <--- Property name is 'tickets'
          public_days: publicDaysResult
      }
  };
  ```
- **Frontend (`AttendeesList.jsx`)**: Expects ticket types in a property named `ticket_types`.
  ```javascript
  setTicketTypes(data.ticket_types || []); // <--- Expects 'ticket_types'
  ```

The fix is to update the frontend to read from `data.tickets`.

### Client
#### [MODIFY] [AttendeesList.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AttendeesList.jsx)
- Update the `fetchTicketTypes` function to use `data.tickets` instead of `data.ticket_types`.

## Verification Plan

### Manual Verification
1.  **Navigate to Admin Attendees List**:
    - Go to `/manage/attendees/{slug}` for an existing event (e.g., `warbirds-downunder-2024`).
2.  **Inspect Dropdown**:
    - Click on the "Ticket Type" dropdown filter.
    - **Pass criteria**: The dropdown lists the actual ticket types for that event (e.g., "Gold Pass", "General Admission", etc.) instead of just "All Tickets".

### Automated Verification
- No new automated tests are proposed for this UI bug fix, verifying manually is sufficient and most effective.
