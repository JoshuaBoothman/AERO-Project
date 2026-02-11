# Implement 'Register Now' Navigation Logic

**Date**: 2026-02-11
**Author**: Antigravity (Startup Engineer)

## Goal Description
The goal is to streamline the event registration process by adding a prominent "Register Now" button to the Event Details page.
This button will have conditional logic:
- **Logged In Users**: Directed immediately to the event's registration/shop page to complete their purchase (e.g. `/events/[slug]/shop`).
- **Guests**: Directed to the Login page with a clear message explaining they must log in to register. After logging in, they should be automatically redirected back to the registration page.

This feature improves user acquisition by reducing friction for existing members and clarifying requirements for new users.

## User Review Required
> [!NOTE]
> **No Database Changes Required**
> The existing database schema (`events`, `attendees`, etc.) fully supports this feature. No SQL script is needed.

> [!IMPORTANT]
> **Login Redirection Logic**
> The Login page will be updated to support a `redirectTo` (or `from`) state, allowing users to land exactly where they intended after authentication. This is a pattern we should use globally moving forward.

## Proposed Changes

### Frontend (`client/`)

#### [MODIFY] [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
-   **Add**: "Register Now" button near the event title/description.
-   **Logic**:
    -   Check `user` from `useAuth()`.
    -   **If Logged In**: `navigate('/events/${slug}/shop')`.
    -   **If Guest**: `navigate('/login', { state: { from: `/events/${slug}/shop`, message: "To register or shop for this event you must have a login." } })`.

#### [MODIFY] [Login.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Login.jsx)
-   **Update**: Read `location.state` for `message` and `from`.
-   **UI**: Display `state.message` in a warning/info alert if present (e.g., standard Bootstrap/Tailwind alert styles).
-   **Logic**:
    -   On successful login, check `location.state.from`.
    -   If present, `navigate(location.state.from)`.
    -   If absent, fall back to existing logic (`/admin` or `/`).

## Verification Plan

### Automated Tests
-   None (Project currently has no frontend test suite setup).

### Manual Verification
1.  **Scenario: Guest User**
    -   Logout if logged in.
    -   Navigate to an Event page (e.g., `/events/test-event`).
    -   Click "Register Now".
    -   **Verify**: Redirects to `/login`.
    -   **Verify**: Login page shows alert: "To register or shop for this event you must have a login."
    -   Login with valid credentials.
    -   **Verify**: Redirects automatically to `/events/test-event/shop`.

2.  **Scenario: Logged In User**
    -   Login as a standard user.
    -   Navigate to an Event page.
    -   Click "Register Now".
    -   **Verify**: Redirects immediately to `/events/test-event/shop`.

3.  **Scenario: Admin User (Regression)**
    -   Login directly via `/login` (no redirect state).
    -   **Verify**: Redirects to `/admin` as before.
