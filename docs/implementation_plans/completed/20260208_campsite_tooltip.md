# Campsite Tooltip Implementation Plan

## Goal Description
The goal is to implement a tooltip that displays availability details when a user hovers over a campsite on the map. This applies to both the **Admin Map Tool** and the user-facing **Camping Booking Page**.
The tooltip will list specific dates that are available or unavailable, allowing users to make informed decisions without clicking every site.

## User Review Required
> [!NOTE]
> No database schema changes are required for this feature as the booking data already exists.

## Proposed Changes

### API Layer

#### [MODIFY] [getCampsites.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampsites.js)
- **Goal**: Return actual booking records instead of just a boolean `is_booked` flag when date parameters are provided.
- **Changes**:
    - Modify the query to select `check_in_date`, `check_out_date` from `campsite_bookings`.
    - Join or subquery to fetch these bookings for the requested `startDate` to `endDate` range.
    - Return a `bookings` array for each site in the JSON response.

### Client Layer

#### [NEW] [CampsiteTooltip.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteTooltip.jsx)
- **Goal**: valid Reusable component for displaying site status and date lists.
- **Features**:
    - **Inputs**: `siteNumber`, `status` (Available, Partial, Booked), `bookings` (array of dates), `eventRange` (start/end).
    - **Logic**:
        - Calculate unavailable date ranges from `bookings`.
        - Inverse calculation to show available date ranges (optional, or just show "Unavailable: Feb 12-14").
        - Format dates nicely (e.g., "Mon Feb 12").
    - **Styling**: Absolute positioned `div` with z-index, white background, shadow, and rounded corners.

#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)
- **Goal**: Fetch booking data and display the tooltip.
- **Changes**:
    - **Data Fetching**: Update `fetchCampgroundData` to pass `startDate` and `endDate` from the `selectedEvent` (derived from `events` list).
    - **State**: Add `hoveredSite` state to track which site is being hovered.
    - **Render**:
        - Remove `title` attribute from site `div`.
        - Render `<CampsiteTooltip />` when `hoveredSite` is present.
        - Add `onMouseEnter` / `onMouseLeave` handlers to site pins.

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
- **Goal**: Display the tooltip on the public booking page.
- **Changes**:
    - **State**: Add `hoveredSite` state.
    - **Render**:
        - Remove `title` attribute.
        - Render `<CampsiteTooltip />` inside the map container.
        - Reuse the existing booking data already present in `site.bookings`.

## Verification Plan

### Manual Verification
1.  **Admin View**:
    - Login as Admin.
    - Go to **Campgrounds** (Admin Map Tool).
    - Select an Event.
    - Select a Campground.
    - Hover over a site that is known to be booked.
    - **Verify**: Tooltip appears showing "Unavailable: [Date Range]".
    - Hover over an available site.
    - **Verify**: Tooltip shows "Available".

2.  **User View**:
    - Go to the **Camping** page for an event.
    - Hover over a red (booked) site.
    - **Verify**: Tooltip shows booked dates.
    - Hover over a partially booked (pink) site.
    - **Verify**: Tooltip shows which specific dates are booked.

### Automated Tests
- No new automated tests planned for this visual/interactive feature, relying on manual verification of the UI.
