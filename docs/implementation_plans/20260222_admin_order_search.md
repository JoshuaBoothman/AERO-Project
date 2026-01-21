# Admin Orders Search & Filtering

## Goal Description
Enhance the "Admin: All Orders" page processing by implementing a robust search and filtering system. Admins must be able to filter orders by:
-   **Date Range** (Start/End)
-   **Text Search** (Name, Email, Order ID)
-   **Status** (Paid, Pending, Failed, Refunded, etc.)
-   **Event** (Dropdown selection)

## Proposed Changes

### Backend (API)
#### [MODIFY] [getAdminOrders.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getAdminOrders.js)
- Update SQL query to accept multiple optional filters:
    - `search` (matches first_name, last_name, email, order_id)
    - `startDate` / `endDate` (matches `created_at`)
    - `status` (exact match on order status)
    - `eventId` (exact match)
- Ensure implementation uses parameterized queries to prevent SQL injection.
- Review index usage for performance if possible (though low volume).

### Frontend (Client)
#### [MODIFY] [AdminOrders.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminOrders.jsx)
- **Filter Bar**: Create a new filter component above the table containing:
    -   **Text Input**: Search (Name/Email/ID)
    -   **Date Range Picker**: "From" and "To" dates.
    -   **Dropdown**: Status (All, Paid, Pending, etc.)
    -   **Dropdown**: Event (Dynamic list of events).
- **Logic**:
    -   Debounce text input.
    -   Update query parameters and refetch data on filter change.
    -   Add "Reset Filters" button.

## Verification Plan
### Manual Verification
1.  **Date Filtering**: Select a date range. Verify orders outside range are excluded.
2.  **Combined Search**: Search for "Josh" AND Select "Paid" status. Verify results match criteria.
3.  **Event Scope**: Switch Event dropdown. Verify only orders for that event are shown.
4.  **Export**: (Optional/Future) Ensure filtered view is what would be exported if CSV export exists.
