# Admin Camping Report - Grid View & Partial Status

**Goal**: Transform the current Admin Camping Availability Report into a grid view that visualizes daily availability for each campsite and correctly identifies "Partially Booked" sites using the same logic as the user-facing booking map.

## User Review Required

> [!NOTE]
> **No Database Changes Required**: The existing API endpoint `/api/reports/camping-availability` already fetches all active campsites and their overlapping bookings (using a LEFT JOIN). This is sufficient to build the grid view purely on the frontend. A SQL script is not needed.

## Proposed Changes

### Logic Explanation

We will replicate the User-Facing "Partial" logic from `CampingPage.jsx` into the Admin Report:

1.  **Total Event Nights calculation**:
    *   Derived from the selected Event's `start_date` and `end_date`.
    *   `totalEventNights = ceil( (EventEnd - EventStart) / (24 hours) )`.

2.  **Booked Nights calculation (Per Site)**:
    *   We will aggregate all bookings for a single site.
    *   Calculate the number of *unique* nights occupied by these bookings within the event window.

3.  **Status Determination**:
    *   **Fully Booked (Red)**: `bookedNights >= totalEventNights`
    *   **Partially Booked (Pink)**: `bookedNights > 0` AND `bookedNights < totalEventNights`
    *   **Available (Green)**: `bookedNights == 0`

### Frontend: Admin Camping Report

#### [MODIFY] [CampingAvailabilityReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx)

I will completely update the rendering logic of this component to display a **Grid**.

**1. Data Processing:**
   - Group the flat API response by `campsite_id`.
   - For each site, store:
     - Basic Info (Number, Type).
     - Array of Bookings.
     - Computed Status (based on logic above).

**2. Grid Interface Description:**
   - **Header Row**:
     - Fixed Columns: `Site`, `Type`, `Status`.
     - Dynamic Columns: One column for each date in the selected date range.
   - **Data Rows (Per Campsite)**:
     - **Site**: Site Number.
     - **Type**: Powered/Unpowered.
     - **Status**: A badge showing the computed status.
       - <span style="color:red">**Full** (Red Background)</span>
       - <span style="color:#ff69b4">**Partial** (Pink Background)</span>
       - <span style="color:green">**Available** (Green Background)</span>
     - **Date Columns**:
       - Iterate through each day in the selected range.
       - If the site is booked for that night, display a visual marker (e.g., filled cell or 'X').
       - If available, leave empty or light color.
       - *Hover/Tooltip*: showing the `Booked By` name and `Order #` on the booked cells.

**3. Filters:**
   - Retain existing filters (Event, Start Date, End Date).
   - Ensure changing the Event updates the "Total Event Nights" reference.

## Verification Plan

### Automated Tests
- None planned (frontend-only logic change).

### Manual Verification
1.  **Partial Status Test**:
    - Log in as Admin.
    - Go to **Reports > Camping**.
    - Select an Event.
    - Locate a site that has a booking shorter than the full event duration.
    - **Verify**: The Status column shows "Partial" (Pink).
    - **Verify**: The specific dates booked are marked in the grid.
2.  **Full Status Test**:
    - Locate a site booked for the entire event.
    - **Verify**: Status is "Booked" (Red).
    - **Verify**: All date columns are marked.
3.  **Available Test**:
    - Locate an empty site.
    - **Verify**: Status is "Available" (Green).
    - **Verify**: No dates are marked.
