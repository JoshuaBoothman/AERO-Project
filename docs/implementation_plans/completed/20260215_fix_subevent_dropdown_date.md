# Fix Subevent Dropdown Date Discrepancy

**Goal**: Correct the date displayed in the "Official Dinner Subevent (Auto-Add)" dropdown on the Edit Event page to match the actual subevent date.

## Problem Description
The "Official Dinner Subevent (Auto-Add)" dropdown currently displays a date (e.g., "11 Jul 2026") that differs from the configured date of the subevent (e.g., "10 Jul 2026").
This occurs because the `EventForm.jsx` component uses `toLocaleDateString` to format the date. This method applies the user's local timezone offset to the date string received from the API (which likely represents the date in UTC).
However, the application architecture relies on dates being treated as "wall-clock" time (stored as ISO strings where the UTC component represents the local time). The rest of the application (including the "Edit Subevent" modal) uses custom helpers in `dateHelpers.js` to extract these "wall-clock" values (using `getUTC*` methods) to avoid timezone shifting.
By applying a timezone conversion to a date that is already effectively "local time in UTC wrapper", the date is shifted incorrectly (e.g., 4 PM becomes 2 AM the next day if the user is in standard AEST vs UTC).

## User Review Required
> [!NOTE]
> **No Database Changes Required**: This is a frontend-only fix. The data in the database is correct; only the display logic in the specific dropdown is flawed.

## Proposed Changes

### Client
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- Import `formatDateForDisplay` and `formatDateTimeForDisplay` from `../../utils/dateHelpers`.
- Remove the local `formatDateDisplay` helper function and replace its usage with the imported helpers.
- Update the dropdown option label to use `formatDateForDisplay` (or `formatDateTimeForDisplay` if time is desired) for consistency.

**Current Logic (Flawed):**
```javascript
// Inside EventForm.jsx
const formatDateDisplay = (isoString) => {
    // ...
    return date.toLocaleDateString('en-GB', ...); // Applies browser timezone
};
```

**New Logic:**
```javascript
import { formatDateTimeForDisplay } from '../../utils/dateHelpers';

// ... in return JSX ...
{subevents.map(s => (
    <option key={s.subevent_id} value={s.subevent_id}>
        {s.name} ({formatDateTimeForDisplay(s.start_time)})
    </option>
))}
```

## Proposed SQL Script
*No database changes are required for this fix.*

## Verification Plan

### Manual Verification
1.  **Navigate to Edit Event Page**:
    - Open the application and go to the "Events" section.
    - Click "Edit" on an existing event (e.g., "Festival of Aeromodelling 2026").
2.  **Check Dropdown**:
    - Locate the "Official Dinner Subevent (Auto-Add)" dropdown.
    - Verify that the date displayed for "Official Dinner" matches the date shown in the "Edit Subevent" modal (e.g., "10/07/2026 16:00" or similar).
    - Ensure it no longer shows "11 Jul".
3.  **Verify Subevent Details**:
    - Go to the "Subevents" management page (or open the subevent modal if accessible).
    - Confirm the date is indeed what is expected (e.g., 10th July).
