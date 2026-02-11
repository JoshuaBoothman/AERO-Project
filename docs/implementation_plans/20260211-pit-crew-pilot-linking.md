# Pit Crew Pilot Linking (In-Cart)

## Goal
Enable users to link a "Pit Crew" ticket to a "Pilot" ticket that is currently in the cart (unpaid), in addition to existing paid pilots. This resolves the friction where a user buying both tickets in one transaction cannot link them.

## User Review Required
> [!NOTE]
> **No Database Changes Required**: The `attendees` table already has `linked_pilot_attendee_id`. The changes are purely logic-based in the React frontend and Node.js backend to handle temporary IDs during the checkout flow.

## Proposed Changes

### Client
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
*   **Logic**:
    *   Currently, the modal only looks at `myPilots` (existing DB records) and `details` (items *currently being edited* in the active modal).
    *   Update the logic to also iterate through the `cart` prop.
    *   Filter `cart` items for `TICKET` type where `system_role` is 'pilot' or 'junior_pilot'.
    *   Extract attendees from these cart items (using `tempId` and `firstName`/`lastName`).
    *   Append these "In Cart" pilots to the `allPilots` list available in the dropdown.
*   **Interface**:
    *   The "Select Pilot" dropdown will show new entries labeled `Name (In Cart)`.
    *   Selecting one will store `linkedPilotTempId` instead of `linkedPilotAttendeeId`.

### API
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Fix Missing Logic**:
    *   Locate the placeholder comments around line 363 (`// Add to list for postponed update`).
    *   Implement the actual array push: `pendingPilotLinks.push({ attendeeId, linkedPilotTempId: attendeeData.linkedPilotTempId });`.
    *   This ensures the existing (but previously dormant) post-processing loop at the end of the file actually receives data to process (Lines 816+).

## Verification Plan

### Manual Verification
1.  **Scenario: Mixed Cart Linking**
    *   **Login** as a user.
    *   **Go to Store** and add a **Pilot Ticket** (fill details: "Maverick Mitchell").
    *   **Add a Pit Crew Ticket**.
    *   In the Pit Crew modal, select **"Link to Registered Pilot"**.
    *   **Verify**: "Maverick Mitchell (In Cart)" appears in the dropdown.
    *   **Select** it and add to cart.
    *   **Checkout** (Pay Later / Mock Payment).
    *   **Verify DB**: Run `SELECT TOP 1 * FROM attendees ORDER BY attendee_id DESC` and confirm the Pit Crew attendee has `linked_pilot_attendee_id` set to Maverick's new ID.

2.  **Scenario: Existing Pilot Linking (Regression Test)**
    *   Ensure linking to an *existing* (paid) pilot still works.
