# Dashboard Subevent Card Cleanup

Remove the aggregate registration and capacity information from the top of the Subevents card on the Admin Dashboard. This is a UI-only change to declutter the dashboard.

## User Review Required

> [!NOTE]
> This change is purely visual. No database columns are being removed, and no data is being deleted, it is simply being hidden from this view.

## Proposed Changes

### Client

#### [MODIFY] [AdminDashboard.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminDashboard.jsx)
- Remove the summary section displaying "Registrations" and "Capacity" totals (approx lines 222-231).
- Remove the calculation logic for `totalSubeventCap` and `totalSubeventReg` if they become unused.

## Verification Plan

### Automated Tests
- `npm run lint` in `client/` to ensure no unused variables remain.

### Manual Verification
- Start the app with `npm run dev`.
- Navigate to `/admin`.
- Verify the "Subevents" card still renders the list of subevents but lacks the top summary block.
- Verify no console errors.
