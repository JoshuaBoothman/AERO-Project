# Fix Subevent Date Reversion Bug

When changing the start and end dates of a subevent (as Admin), there appears to be a bug that is not saving the date change. I change the start date, and it appears to have changed correctly, I go back in and change the end date, and the start date reverts back to what it was previously

The "Start date reverts" bug is likely caused by aggressive browser caching of the `GET /api/events/{id}/subevents` request. When the user updates the Start Date, it is saved to the server. However, the subsequent list refresh fetches the *cached* (stale) data. When the user opens the "Edit" modal again to change the End Date, the form is populated with the *old* Start Date. Saving this form then overwrites the previously updated Start Date with the old value.

This plan addresses this by enforcing fresh data fetches and hardening the date parsing logic.

## User Review Required

> [!NOTE]
> No database schema changes are required for this fix.

## Proposed Changes

### Client

#### [MODIFY] [AdminSubevents.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminSubevents.jsx)

- Add `cache: 'no-store'` to the `fetchSubevents` call to ensure the list is always fresh from the server.
- Add `cache: 'no-store'` to the list refresh call inside `handleFormSubmit`.

#### [MODIFY] [SubeventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/admin/SubeventForm.jsx)

- Update `formatDateTime` to explicitly handle the date string to ensure it renders the "Wall Clock Time" seen in the database regardless of timezone indicators (to prevent unexpected shifts if the API behavior changes).
- Ensure `initialData` updates are robust.

## Verification Plan

### Automated Tests
- None valid for this UI interaction bug without E2E framework.

### Manual Verification
1.  **Reproduction Steps (Pre-Fix)**:
    - Open "Manage Subevents".
    - Edit a subevent. Change `Start Time` (e.g., 10:00 -> 11:00). Save.
    - Validate the list shows the new time (11:00). (If it shows 10:00, the caching hypothesis is confirmed immediately).
    - Open "Edit" again.
    - Change `End Time` (e.g., 12:00 -> 13:00). *Do not touch Start Time*.
    - Save.
    - Validate that `Start Time` is STILL 11:00. (The bug would verify it reverted to 10:00).

2.  **Verification (Post-Fix)**:
    - Perform the same steps.
    - Confim `Start Time` persists as 11:00 after the second edit.
