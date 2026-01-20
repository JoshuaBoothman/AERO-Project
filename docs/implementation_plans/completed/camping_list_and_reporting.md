# Camping List View & Admin Reporting

## Goal Description
Implement alternative views for camping availability and booking to supplement the existing map-based interface.

1.  **User Side**: A simple list view of campsites available for a selected date range, showing prices, with the ability to book directly from the list.
2.  **Admin Side**: A reporting list view to check availability and bookings for an event over a specific date range.

## User Review Required
> [!NOTE]
> **No Immediate Code Changes**: This document serves as a plan for future development. No code is being implemented at this time.
> **Schema Changes**: The user has specified that any necessary schema changes will be performed manually.

## Proposed Changes

### User Interface (Campground Booking)
#### [NEW] [CampingListView.jsx] (Conceptual)
- **Location**: `client/src/components/Camping/` (or similar)
- **Features**:
    - **Date Range Picker**: Allow user to select Start and End dates (or defaults to full event).
    - **Availability Query**: Fetch campsites that are available for the selected range.
    - **List Display**:
        - Render a list of **ALL** campsites (including booked ones).
        - Show Site Name/Number.
        - Show Price (calculated based on selection).
        - **Status Indicator**:
            - **Available**: Bookable.
            - **Reserved**: Greyed out/Disabled if booked for *any* part of the selected range.
        - **"Book Now" Button**: Triggers the booking flow (likely opening the existing booking modal or adding to cart directly).
- **Integration**:
    - Add a toggle or tab on the main Camping page to switch between "Map View" and "List View". (Do not modify Map View functionality).

### Admin Interface (Reporting)
#### [NEW] [CampingAvailabilityReport.jsx] (Conceptual)
- **Location**: `client/src/components/Admin/Reports/`
- **Features**:
    - **Event Selector**: Dropdown to choose the event.
    - **Date Range Picker**: Start and End date inputs (support single day selection).
    - **Report Logic**:
        - Query `campsite_bookings` and `campsites`.
        - Determine status for each site in the range:
            - **Booked**: If a booking exists affecting these dates.
            - **Available**: If no booking overlaps.
    - **List Display**:
        - Table showing Site Number, Status (Booked/Available), and Customer Name (if booked).
    - **Export**: (Optional future) CSV export.

### API / Backend
#### [MODIFY] [getCampgroundAvailability.js](file:///api/src/functions/getCampgroundAvailability.js)
- Ensure the API can efficiently return a list format suitable for the UI, or create a new endpoint `getCampgroundListAvailability` if the map data payload is too heavy.
- **Admin Endpoint**: Create `getAdminCampingReport` to fetch detailed availability status including booker details for the reporting view.

### Database Schema
*Note: Any schema changes will be applied manually by the user.*
- **Performance**: May require indices on `campsite_bookings(start_date, end_date)` and `campsite_bookings(campsite_id)` for faster range queries if data volume is high.
- **Views**: Could use a SQL View to simplify available/booked logic if complex.

## Verification Plan

### Manual Verification
1.  **User List View**:
    - Select a date range where some sites are known to be booked.
    - Verify booked sites do not appear in the "Available" list (or appear as booked).
    - Verify available sites appear with correct calculated price.
    - Click "Book" and ensure the correct site is added to cart/booking flow.
2.  **Admin Report**:
    - Select a single date.
    - Verify sites booked for that date show as "Booked" with correct customer name.
    - Verify unbooked sites show as "Available".
    - Select a range (e.g., 3 days).
    - Verify a site booked for *any* part of that range shows as "Booked" (or partial status if requested).
