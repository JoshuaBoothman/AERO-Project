# Flight Line Roster Filtering

# Goal
Allow the filtering of the Flight Line roster by Flight Line. This will enable administrators to view and manage the roster for specific flight lines (e.g., "North Line", "South Line") independently, reducing visual clutter and making management easier.

## User Review Required
> [!NOTE]
> This implementation uses client-side filtering. The entire roster for the event is fetched once, and filtering happens instantly in the browser. This is efficient for the expected data volume.

## Proposed Changes

### Client
#### [MODIFY] [FlightLineRoster.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/FlightLineRoster.jsx)
- Add state `flightLines` to store the list of available flight lines.
- Add state `selectedFlightLine` (defaulting to 'all').
- Fetch flight lines on component mount using `/api/events/${event.event_id}/flight-lines`.
- Add a "Filter by Flight Line" dropdown control next to the Date selector.
- Update the `filteredRoster` logic to include the `selectedFlightLine` condition:
    ```javascript
    const filteredRoster = roster.filter(slot => 
        slot.roster_date === selectedDate && 
        (selectedFlightLine === 'all' || slot.flight_line_id === parseInt(selectedFlightLine))
    );
    ```

## Verification Plan

### Manual Verification
1.  **Navigate to Roster**: Go to the Admin Dashboard -> Select an Event -> Flight Lines -> Roster.
2.  **Verify Dropdown**: Ensure a new "Filter by Flight Line" dropdown appears next to the Date selector.
3.  **Default State**: Verify the dropdown defaults to "All Flight Lines" and all roster slots are visible.
4.  **Filter Selection**: Select a specific Flight Line from the dropdown.
5.  **Verify Filter**: Confirm that the table updates to show *only* slots for the selected Flight Line.
6.  **Change Date**: Change the date and ensure the Flight Line filter persists (or resets if that's preferred, though persistence is usually better).
7.  **Empty State**: Select a Flight Line that has no slots for the selected date and verify the "No roster slots" message (or empty table) is shown correctly.
