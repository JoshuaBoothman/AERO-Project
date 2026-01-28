# Campsite Availability in List View

This plan outlines the changes to provide a detailed availability view for campsites in the list mode, allowing admins to see availability dates for each campsite.

## Goal Description
Display a grid of availability dates for each campsite in the list view, similar to the provided screenshot availability reference. This will help admins quickly identify open dates within an event's duration. The view will display columns for each date from the event start to event end, indicating availability status.

## User Review Required
> [!NOTE]
> No schema changes are required.

## Proposed Changes

### Backend
#### [MODIFY] [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js)
- Update the SQL query to `LEFT JOIN` `campsite_bookings` instead of just checking for existence.
- Fetch `check_in_date`, `check_out_date`, and potentially `booking_id` for bookings within the requested event date range.
- Update the result processing to aggregate bookings into a `bookings` array for each campsite object.
- Ensure the `bookings` array contains objects with `{ start: Date, end: Date, status: 'booked' }` (or similar).

### Frontend

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
- Pass `dates` (event start and end dates) to `CampingListView` as props.

#### [MODIFY] [CampingListView.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampingListView.jsx)
- Accept `eventStartDate` and `eventEndDate` props.
- Generate an array of dates between the event start and end.
- Update the table header to include columns for each date in the range (e.g., "Jan 1", "Jan 2").
- Update the table body to render a cell for each date column for every campsite.
- In each date cell, check if the date falls within any of the campsite's `bookings`.
- Display a symbol (e.g., `X` for booked, checkmark or empty for available) based on the status.
- Implement logic to handle "campsite can be booked on the same day that the previous camper departs" (night-based logic).
  - A date column represents the "night of" that date.
  - If a booking is Jan 1 - Jan 3:
    - Jan 1 Night: Booked
    - Jan 2 Night: Booked
    - Jan 3 Night: Available (checkout day)

## Verification Plan

### Automated Tests
- None strictly required for this feature as it's visual, but we can verify the API response format.
- Run `curl` to `http://localhost:7071/api/events/{eventId}/campgrounds?start_date=...&end_date=...` and verify `bookings` array is present in the response.

### Manual Verification
1.  **Setup**: ensure there is an event with some bookings.
2.  **Navigate**: Go to the Camping page for the event (e.g., via Admin Dashboard or direct URL).
3.  **View**: Switch to "List" view.
4.  **Verify Grid**:
    - Check that columns exist for each day of the event.
    - Check that existing bookings show as "Booked" (X) on the correct nights.
    - Check that available nights show as "Available" (checkmark or green).
    - Verify that a booking ending on a date leaves that date available for a new booking (e.g., booking ends Jan 3, Jan 3 column should show available if no other booking starts).
5.  **Booking**: Attempt to select a site and verified the "Action" column or selection logic still works.
6.  **Responsive**: Check horizontal scrolling if the event is long.
