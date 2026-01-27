# Admin Dashboard - View Attendees List

## Goal Description
Implement a "View Attendees" feature on the Admin Dashboard to provide a comprehensive, filterable, and sortable list of all event attendees. This will allow administrators to easily manage and view attendee details including flight line duties, heavy model status, and official dinner attendance.

## User Review Required
> [!NOTE]
> **No Database Changes Needed**: All required data fields (AUS Number, Heavy Models, etc.) already exist in the database or can be derived from existing tables.
> **Custom Table Implementation**: Since no external table library (like ag-grid) is present, a lightweight, custom React table with sorting and filtering will be implemented to keep dependencies low ("Boring Solution").

## Proposed Changes

### Backend [API]

#### [NEW] `api/src/functions/getAdminAttendees.js`
- **Endpoint**: `GET /api/admin/attendees/{slug}`
- **Logic**:
    - Validate Admin Token.
    - JOIN `attendees`, `persons`, `event_ticket_types`.
    - **Derived Fields**:
        - `Heavy Models (Y/N)`: Calculated by checking if the person has any planes registered with `is_heavy_model = 1`.
        - `Attendee Name`: Concatenation of `first_name` and `last_name`.
        - `AUS Number`: Mapped from `persons.license_number`.
    - **Return**: JSON array of flat objects optimized for the frontend table.

### Frontend [Client]

#### [NEW] `client/src/pages/admin/AttendeesList.jsx`
- **Features**:
    - **Search**: Global text search (Name, Email, AUS Number).
    - **Filters**: Dropdowns for Ticket Type, State, Duties (Y/N), Heavy Model (Y/N), Dinner (Y/N).
    - **Sorting**: Clickable headers for all columns.
    - **Export**: (Optional but good practice) Simple "Copy to Clipboard" or CSV export button if time permits.
- **Columns**:
    - Name, Ticket Type, Suburb, State, Arrival, Departure, AUS #, Dinner (Y/N), Flight Line (Y/N), Heavy Model (Y/N), Inspector (Y/N).

#### [MODIFY] `client/src/App.jsx`
- Add route: `<Route path="/admin/attendees/:slug" element={<AttendeesList />} />` (protected by AdminGuard).

#### [MODIFY] `client/src/pages/admin/AdminDashboard.jsx`
- Add "View Attendees" button in the "Attendees" card or Header area.
    - Suggestion: Add it next to the existing "View Air Show Attendees" or inside the Attendees summary card.

## Verification Plan

### Manual Verification
1.  **Navigation**: Click "View Attendees" on Dashboard -> Verify navigation to new page.
2.  **Data Accuracy**: Compare list against a known attendee (e.g., yourself or a test user). Verify "Heavy Models" flag is Yes if you have a heavy plane.
3.  **Filtering**:
    - Filter by "State: NSW" -> Verify only NSW attendees show.
    - Filter by "Heavy Models: Yes" -> Verify only those with heavy planes show.
4.  **Sorting**: Click "Name" header -> Verify A-Z and Z-A sorting.
5.  **Search**: Type a unique AUS Number -> Verify specific user is found.

### SQL Script (Proposed)
No database schema changes are required. The following query validates that the logic for "Heavy Models" works:

```sql
-- VALIDATION SCRIPT ONLY (No changes)
SELECT 
    p.first_name, 
    p.last_name, 
    CASE WHEN EXISTS (SELECT 1 FROM planes pl WHERE pl.person_id = p.person_id AND pl.is_heavy_model = 1) THEN 'Y' ELSE 'N' END as HasHeavyModel
FROM persons p
WHERE p.email = 'your_email@example.com'; -- Replace with your email to test
```
