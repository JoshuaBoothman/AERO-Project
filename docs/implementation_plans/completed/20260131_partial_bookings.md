# Partial Booking Display Implementation

## Goal
To visually distinguish campsites that have *existing bookings* (for other dates within the event) from completely empty campsites, while still marking them as available for the user's selected dates. These "Partially Booked" sites will be displayed with a distinct pink color on the map.

## User Review Required
> [!NOTE]
> **No Database Changes Required**: The existing API `getCampgroundAvailability` already returns all bookings for the event period to the frontend. We can implement this purely in the React client.

## Proposed Changes

### Client

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
- **Update Map Legend**: Add a "Partial" item (Pink) to the legend.
- **Update Pin Logic**:
    - Current: `Red` (Unavailable/Booked for selected dates) vs `Gold` (Available).
    - New:
        1. **Unavailable**: `Red` (If `!is_available` - conflicts with user dates).
        2. **Selected**: `Blue` (If in cart/selected).
        3. **Partially Booked**: `Pink` (If `is_available` AND `site.bookings.length > 0`).
        4. **Fully Available**: `Gold` (If `is_available` AND `site.bookings.length === 0`).

#### [MODIFY] [CampingListView.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampingListView.jsx)
- **Update Status Column**:
    - Display "Partial" badge (Pink/Orange background) when site is available but has existing bookings.

## Database Changes
No schema changes or SQL scripts are required. The current `campsite_bookings` table and `getCampgroundAvailability` function already provide the necessary data (`site.bookings` array).

## Verification Plan

### Manual Verification
1.  **Scenario: Partial Booking**
    -   Identify a campsite (e.g., Site 5) that has a booking for *part* of the event (e.g., Jan 5-6).
    -   Select dates that do *not* overlap (e.g., Jan 1-3).
    -   **Expectation**: Site 5 pin is **Pink** (Partial). Status shows "Partial".
    -   **Action**: Click site. It should allow selection (turns Blue).

2.  **Scenario: Unavailable**
    -   Select dates that *do* overlap with Site 5's booking (e.g., Jan 5-6).
    -   **Expectation**: Site 5 pin is **Red** (Unavailable).

3.  **Scenario: Fully Available**
    -   Identify a campsite with *no* bookings at all.
    -   **Expectation**: Pin is **Gold** (Available).
