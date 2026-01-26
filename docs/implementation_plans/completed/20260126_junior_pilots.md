# Junior Pilot System Role Implementation

## Goal Description
Introduce a new system role `junior_pilot` to `event_ticket_types`. This role is functionally similar to `pilot` (requires details like AUS number, MOP agreement, Plane registration) but **excludes** the requirement/option for Flight Line Duties.

## User Review Required
> [!IMPORTANT]
> **Database Change**: You must manually execute the SQL script below to update the `CHECK` constraint on `event_ticket_types`.

## Proposed Changes

### Database
#### [MANUAL_ACTION] Update System Role Constraint
Run the following SQL script to allow `junior_pilot` in the `system_role` column:

```sql
-- Drop existing constraint (assuming name is CK_SystemRole, please verify)
ALTER TABLE event_ticket_types DROP CONSTRAINT CK_SystemRole;

-- Re-add constraint with 'junior_pilot' included
ALTER TABLE event_ticket_types 
ADD CONSTRAINT CK_SystemRole 
CHECK ([system_role] IN ('admin', 'staff', 'pit_crew', 'pilot', 'spectator', 'junior_pilot'));
```

### Backend Changes

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   **Logic**: Update `isPilot` check to include `junior_pilot`.
-   `const isPilot = ['pilot', 'junior_pilot'].includes(ticketType.system_role);`
-   **Reason**: Ensures validation logic runs. Since Junior Pilots won't click "Agreed to Duties", they will fall into the "No Duties" price bucket. The User must configure `price` and `price_no_flight_line` to be identical for Junior Pilots to avoid surcharges.

#### [MODIFY] [getOrderDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getOrderDetail.js)
-   **Logic**: Update filter for fetching planes to include `junior_pilot`.
-   `const pilotPersonIds = [...new Set(itemsResult.filter(i => ['pilot', 'junior_pilot'].includes(i.system_role)).map(i => i.person_id))];`

#### [MODIFY] [getUserEventAttendees.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getUserEventAttendees.js)
-   **Query**: Update SQL query to return both pilots and junior pilots.
-   `AND t.system_role IN ('pilot', 'junior_pilot')`

### Frontend Changes

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
-   **Pilot Fields**: Show Pilot section for `['pilot', 'junior_pilot']`.
-   **Flight Line Duties Checkbox**: Show **ONLY** for `pilot` (Exclude `junior_pilot`).
-   **Pit Crew Linking**: Allow Pit Crew to link to `junior_pilot` attendees (Update filter in Pit Crew section).

#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
-   **Badges**: Add a visual badge for "Junior Pilot".
-   **Settings**: Show Pilot-specific settings (MOP, Price No Flight Line) for `junior_pilot` so Admins can configure the "same price" mitigation.

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
-   **Display**: Show Pilot Badge and Plane Details for `junior_pilot`.

## Verification Plan

### Manual Verification
1.  **Database**: Run the SQL script and verify `junior_pilot` is accepted.
2.  **Admin**:
    -   Create/Edit a ticket type to be `junior_pilot`.
    -   Set Price and "Price (No Duties)" to the SAME value (e.g., $50).
    -   Verify the setup saves correctly.
3.  **User Booking**:
    -   Select "Junior Pilot" ticket.
    -   Verify Modal shows AUS Number, MOP, Planes.
    -   **Verify** "Flight Line Duties" checkbox is **HIDDEN**.
    -   Complete Order.
4.  **Order Processing**:
    -   Verify Order is created successfully.
    -   Verify `attendees` table shows `flight_line_duties = 0` (or null/false).
    -   Verify Price is correct (Standard Price).
5.  **Post-Purchase**:
    -   Go to "My Attendees". Verify Junior Pilot appears in the list.
    -   Go to specific Order Details. Verify Planes are listed.
