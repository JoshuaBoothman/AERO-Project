# Campsite Booking UI Adjustments

## Goal Description
The goal is to improve the campsite booking interface by moving the "Arrival Date", "Departure Date", and "Check Availability" controls from their current independent container into the "Booking Details" sidebar. This creates a more unified "Control & Details" panel and allocates more vertical space for the map view.

## User Review Required
> [!NOTE]
> No critical user review items, but note that the "Check Availability" loading state will be modified to only mask the map area, keeping the sidebar (and thus the controls) visible during updates.

## Proposed Changes

### Client
#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
1.  **Layout Restructuring**:
    *   Move the `loading` check (currently wrapping the entire `map + sidebar` section) to wrap **only** the Map/List view container.
    *   This ensures the Sidebar remains visible even while fetching availability, preventing UI flashing when the user clicks "Check Availability".
2.  **Sidebar Integration**:
    *   Move the Date Selection Inputs and "Check Availability" button logical block from the top of the page into the Sidebar container.
    *   Style the inputs to stack vertically (or appropriately for the narrower sidebar width) rather than the current horizontal row.
    *   Ensure the "Booking Details" header or the Date Picker section is always the first item in the sidebar.
3.  **Responsive Adjustments**:
    *   Ensure the inputs look good in the sidebar (width: 100%).
    *   Confirm mobile view behavior (Sidebar usually stacks below or above map, check existing flex behavior).

## Detailed Interface Logic
1.  **Initial Load**: The page loads the event details. The Sidebar is visible immediately with Date Inputs (pre-filled with event dates). The Map area shows a loader until availability is fetched.
2.  **User Interaction**:
    *   User changes dates in the Sidebar.
    *   User clicks "Check Availability".
    *   **Map Area**: Turns into a loader/spinner.
    *   **Sidebar**: Remains interactive (though we might disable the button briefly).
    *   **Result**: Map refreshes with new availability colors.
3.  **Sidebar Content Hierarchy**:
    *   **Top**: Date Inputs (Check In, Check Out) + Check Button.
    *   **Middle**: Result Messages (e.g., "Select a site") or Selected Site Details (Site #, Price, Add to Cart).
    *   **Bottom**: Cart Summary (if items exist).

## Database Changes
No database schema changes are required for this UI adjustment.

### SQL Script
```sql
-- No database changes required
```

## Verification Plan

### Manual Verification
1.  **Visual Check**:
    *   Verify the Date Inputs are gone from the top and appear in the Sidebar.
    *   Verify the Map and Sidebar are side-by-side (on desktop).
2.  **Functional Check**:
    *   Change dates and click "Check Availability".
    *   Confirm the map updates correctly without the sidebar disappearing.
    *   Select a site and confirm "Site Details" appear below the Date Inputs in the sidebar.
    *   Add to Cart and verify flow.
3.  **Responsive Check**:
    *   Resize window to mobile size and ensure the layout stacks correctly (Sidebar likely below Map, or check existing behavior).
