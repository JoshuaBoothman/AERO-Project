# Fix 401 on my-attendees Fetch

## Goal
Resolve the 401 Unauthorized error that occurs when the Store Page attempts to fetch the current user's attendees (`/api/events/{slug}/my-attendees`).

## Diagnosis
The error is caused by a **missing HTTP header** in the request. The API requires a custom header `X-Auth-Token` to be present (to bypass Azure's authentication layer), but the `my-attendees` fetch call in `StorePage.jsx` only sends the standard `Authorization` header.

Other files in the codebase (`MyOrders`, `FlightLineRoster`, etc.) **do** implement this header correctly, which is why they are not failing, even though they use a similar `localStorage` pattern.

## Proposed Changes

### Client
#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Update the `fetch` call for `my-attendees` to include the `X-Auth-Token` header.
- Switch the token source to use `useAuth()` (best practice) instead of reading directly from `localStorage`.

## Verification Plan

### Manual Verification
1.  **Login** as a regular user (pilot).
2.  **Navigate** to the Store Page for an event.
3.  **Inspect Network**: Open browser DevTools -> Network tab.
4.  **Verify Request**: Ensure the request to `.../my-attendees` includes the `X-Auth-Token` header and returns `200 OK`.
5.  **Verify UI**: Click "Register" on a subevent and verify your attendees appear in the dropdown.
