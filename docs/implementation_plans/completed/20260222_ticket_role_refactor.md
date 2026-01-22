# Ticket Role Refactor

## Goal Description
Simplify the Ticket Type system by removing redundant boolean flags (`is_pilot`, `is_pit_crew`) and consolidating logic into the single `system_role` field. This prevents conflicting data states and cleans up the UI.

## User Review Required
> [!WARNING]
> **Risk**: High. Existing logic in `createOrder.js` and other functions relies on `is_pilot` and `is_pit_crew` columns. These must be carefully updated to check `system_role` instead BEFORE dropping the columns.

## Proposed Changes

### Database
#### [MODIFY] [check_schema_v2.js](file:///c:/laragon/www/AERO-Project/check_schema_v2.js)
-   **Step 1**: Update data. Set `system_role = 'pilot'` WHERE `is_pilot = 1`. Set `system_role = 'pit_crew'` WHERE `is_pit_crew = 1`.
-   **Step 2**: Drop columns `is_pilot` and `is_pit_crew` from `event_ticket_types`.

### Backend (API)
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
-   Remove `is_pilot` / `is_pit_crew` from input validation and query parameters.
-   Ensure `system_role` is required.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   **Critical**: Search for all references to `is_pilot` and `is_pit_crew`.
-   Replace with `system_role === 'pilot'` and `system_role === 'pit_crew'` checks.

### Frontend (Client)
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
-   **Ticket Modal**:
    -   Remove "Is Pilot Ticket" and "Is Pit Crew Ticket" checkboxes.
    -   Update "System Role" dropdown to include `<option value="pit_crew">Pit Crew</option>`.

## Verification Plan
### Manual Verification
1.  **Admin**: Edit an existing Pilot ticket. Verify "Pilot" is selected in dropdown.
2.  **Admin**: Create a new "Pit Crew" ticket using the dropdown.
3.  **User**: Purchase a Pilot ticket. Verify it still triggers Pilot logic (e.g. asking for license number).
4.  **User**: Purchase a Pit Crew ticket. Verify it triggers Pit Crew logic (e.g. asking for Pilot link).
