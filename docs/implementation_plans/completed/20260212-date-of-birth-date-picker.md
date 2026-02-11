# Consolidate Date Picker for Date of Birth

## Goal
Replace the inconsistencies and usability issues of the browser-native `date` input for "Date of Birth" with a standardized, cross-device friendly component. This will ensure users, especially on mobile, can easily select years in the past without excessive scrolling.

## User Constraints
> [!NOTE]
> **Scope Update**: Confirmed that the "Backend Logic Update" initially proposed is **not required** for the ticket purchase flow. The `createOrder` function correctly handles Date of Birth. The `updateAttendee` function is used in contexts (Order Detail) where DOB editing is not currently exposed, so it can remain as-is for now.

## Proposed Changes

### Frontend: `client/src/components`

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
I will replace the existing `<input type="date" ... />` for `dateOfBirth` with a custom "Three Selects" UI. This approach is widely recognized as the most accessible and robust pattern for Date of Birth input across all devices (Desktop, iOS, Android).

**Detailed Interface Description:**
The new interface will consist of three dropdown (`<select>`) elements. Using native `<select>` elements ensures that mobile devices (iOS/Android) trigger their optimized native pickers (wheels or lists), which is far superior to a calendar view for selecting a year like "1985".

**Structure:**
1.  **Day**: `<select>` with numbers 1-31.
2.  **Month**: `<select>` with full month names (January - December) for clarity.
3.  **Year**: `<select>` with a generic range from `Current Year` down to `Current Year - 110`.

**Logic & Behavior:**
*   **State Management**: The component will internally manage the D, M, Y values and sync to the specific `dateOfBirth` field in the parent state (format: `YYYY-MM-DD`).
*   **Validation & Correction**: 
    *   The component will intelligently handle day-count mismatches (e.g. switching from "31st Jan" to "Feb" will clamp the day to 28 or 29).
    *   It will construct a valid `Date` object string for the application to use.
*   **Styling**: Flexbox layout to sit side-by-side on larger screens and adapt to mobile widths, maintaining the existing visual style of the application.

## Verification Plan

### Manual Verification
1.  **Ticket Purchase Flow**:
    *   Navigate to Store -> Add a ticket to cart.
    *   **Verify UI**: 
        *   Confirm the "Date of Birth" field now shows three distinct dropdowns.
        *   Confirm the "Year" dropdown allows quick selection of past years (e.g., 1980) without scrolling through months.
    *   **Verify Logic**: 
        *   Select "February 31st" sequence -> Verify it corrects to valid date.
        *   Select a valid DOB.
    *   **Submit**: Confirm the order proceeds to cart with the correct date saved.
2.  **Mobile Verification (Simulated)**:
    *   Use Chrome DevTools (iPhone 12 view) to verify the dropdowns are easily tappable.
