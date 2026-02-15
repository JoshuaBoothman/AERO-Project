# Refine Subevent Dropdown Date Format

**Goal**: Change the date format in the "Official Dinner Subevent" dropdown to `dd-MMM-yyyy` (e.g., 15-Feb-2026) and remove the time component.

## Changes

### 1. [MODIFY] [dateHelpers.js](file:///c:/laragon/www/AERO-Project/client/src/utils/dateHelpers.js)
- Add `formatDateForDisplayShortMonth` function.
- It will manually construct the date string using UTC methods and an array of short month names to ensure "wall-clock" consistency without timezone shifts.

### 2. [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- Import `formatDateForDisplayShortMonth`.
- Update the dropdown option to use this new function.

## Verification
- User to visually verify the dropdown format matches "15-Feb-2026".
