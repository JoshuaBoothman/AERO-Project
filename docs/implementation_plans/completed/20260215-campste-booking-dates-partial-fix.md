# Campsite Booking: Logic Fix for Partial Status

## Goal

Fix the "Partial" vs "Full" status logic for campsite bookings.
Currently, the status calculation checks if the *entire* extended booking window (Event Start - 1 Day to Event End + 1 Day) is booked. This causes users who book the actual event dates (e.g., Fri-Sun) to show as "Partial" because they didn't book the optional day before/after.

The new logic will determine "Fully Booked" based on the **Core Event Dates** only.
- If a campsite is booked for all nights of the *core* event -> **Status: Full** (Red).
- If a campsite has any bookings but doesn't cover the core event completely -> **Status: Partial** (Pink).
- If no bookings -> **Status: Available** (Green/Gold).

## Affected Areas

1.  **Public Booking Page** (`CampingPage.jsx`, `CampingListView.jsx`)
2.  **Admin Camping Report** (`CampingAvailabilityReport.jsx`)
3.  **Admin Map Tool / Tooltips** (`AdminMapTool.jsx`, `CampsiteTooltip.jsx`)

---

## User Review Required

> [!NOTE]
> **Database Changes**: No schema changes are required. The fix is purely logic-based in the API and Frontend.
> **Admin Map Tool**: The Admin Map Tool currently does not appear to visualise booking status (pins show active/inactive). However, the shared `CampsiteTooltip` component used there will be updated to support the correct logic if data becomes available.

---

## Proposed Changes

### Backend

#### [MODIFY] [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js)

Update the API to return the `original_event_start` and `original_event_end` (Core Dates) alongside the existing extended dates.

```javascript
// ... existing code ...
const originalStart = eventRes.recordset[0].start_date.toISOString().split('T')[0];
const originalEnd = eventRes.recordset[0].end_date.toISOString().split('T')[0];

return {
    status: 200,
    jsonBody: {
        event_start: eventStart, // Extended (-1 day)
        event_end: eventEnd,     // Extended (+1 day)
        original_event_start: originalStart, // Core Event Start
        original_event_end: originalEnd,     // Core Event End
        // ...
    }
};
```

---

### Frontend

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)

1.  **State**: Store `originalEventBounds` from the API.
2.  **Map Logic**: Update the status calculation loop to use `originalEventBounds` for the "Required Nights" check.
    -   Generate a list of `requiredNights` (from original Start to original End).
    -   Check if *every* required night is covered by the site's bookings.
    -   Set `isFullyBooked` = true if all required nights are covered.
3.  **List View**: Pass `originalEventBounds` to `CampingListView`.

#### [MODIFY] [CampingListView.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampingListView.jsx)

1.  Accept `originalEventStartDate` and `originalEventEndDate` props.
2.  Update the status calculation loop to use these core dates for determining `isFullyBooked`.

#### [MODIFY] [CampsiteTooltip.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteTooltip.jsx)

1.  Accept `coreEventRange` prop.
2.  Implement `isFullyBooked` logic:
    ```javascript
    const isFullyBooked = checkCoverage(site.bookings, coreEventRange);
    ```
3.  Update the status label logic:
    ```javascript
    {relevantBookings.length === 0 ? 'Available' : (isFullyBooked ? 'Booked' : 'Partially Booked')}
    ```
    *(Note: Previously it only showed "Partially Booked" if available, never "Booked" for Full).*

#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)

1.  Pass the core event dates to `CampsiteTooltip` as `coreEventRange`.
    ```jsx
    <CampsiteTooltip
        site={hoveredSite}
        eventRange={{ start: ..., end: ... }} // Extended (if used for filtering)
        coreEventRange={{ start: ..., end: ... }} // Core (for status)
    />
    ```

#### [MODIFY] [CampingAvailabilityReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx)

1.  Update the `processedData` memo.
2.  Calculate `coreEventNights` using `selectedEvent.start_date` and `selectedEvent.end_date` (without the +/- 1 day extension).
3.  Update the `status` determination logic to check if bookings cover the `coreEventNights`.

---

## Verification Plan

### Manual Verification

1.  **Setup**:
    -   Identify an event with dates (e.g., Fri 10th - Sun 12th).
    -   Ensure the "Day Before" (Thu 9th) and "Day After" (Mon 13th) are available.

2.  **Public Booking Page**:
    -   **Scenario 1: Full Event**: Book a site from Fri 10th to Sun 12th.
        -   Verify the map pin turns **RED** (Booked) instead of Pink (Partial).
        -   Verify the List View shows "Booked" (Red).
    -   **Scenario 2: Partial**: Book a site for Fri 10th only.
        -   Verify the map pin turns **PINK** (Partial).
    -   **Scenario 3: Extended**: Book Fri 10th to Mon 13th.
        -   Verify the map pin is **RED** (Booked).

3.  **Admin Availability Report**:
    -   Go to `/admin/reports/camping`.
    -   Select the event.
    -   Verify the site from Scenario 1 (Fri-Sun) shows Status **"Full"** (Red).
    -   Verify the site from Scenario 2 (Fri only) shows Status **"Partial"** (Pink).

4.  **Admin Map Tool**:
    -   Go to Admin Map Tool.
    -   Select the event and campground.
    -   Hover over the pins. Verify the tooltip status text logic matches the above (if bookings are visible).
