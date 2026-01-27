# Camping Availability Report Implementation Plan

# Goal Description
The "Camping Availability Report" returns a 403 Unauthorized error on the live environment (Azure), despite working locally. This is likely due to Azure App Service overwriting the standard `Authorization` header.
The goal is to fix this authentication issue by sending the `x-auth-token` header (which the backend explicitly checks for) and to simultaneously upgrade the report's interface to a premium, modern design using Tailwind CSS v4, replacing the current "basic" inline styles.

## User Review Required
> [!IMPORTANT]
> **Authentication Fix**: The fix involves sending the JWT in a custom `x-auth-token` header in addition to/instead of the standard `Authorization` header. This is a client-side change to bypass Azure's header handling.

## Proposed Changes

### Client
#### [MODIFY] [CampingAvailabilityReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx)
- **Logic**: Update the `fetch` call to include `x-auth-token: token` in the headers.

### Backend
- No changes required. The backend `getAdminCampingReport` already checks for `x-auth-token`.

### Database
- No schema changes required.

## Verification Plan

### Manual Verification
1.  **Auth Check (Live/Dev)**:
    - Log in as an Admin.
    - Navigate to `/admin/reports/camping-availability`.
    - Select an event and dates.
    - Click "Generate Report".
    - **Verify**: The request succeeds (200 OK) and data is displayed.
    - **Verify**: Inspect network request headers to confirm `x-auth-token` is present.

## SQL Script
No database changes are required for this task.
