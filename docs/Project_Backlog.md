# AERO Project Backlog & Enhancements

## High Priority
* [ ] **Attendee Assignment Flow:** * Create UI for users to view their purchased tickets.
    * Allow assigning a specific "Person" (Name/Email) to each ticket.
    * Handle "Guest" creation vs "Existing User" lookup.
* [ ] **Waiver System:** Implement digital waiver signing for assigned attendees.

## Authentication & User Management
- [ ] **Email Confirmation:** Implement a flow to verify user email addresses upon registration (likely using SendGrid or similar).
- [ ] **Social Login:** Add "Sign in with Google" (and potentially Microsoft) using OAuth.
- [ ] **Password Reset:** "Forgot Password" flow with secure token links.
- [ ] **Role Management:** Admin UI to promote users to 'Operational' or 'Admin' roles.

## UI/UX Improvements
- [ ] **Toast Notifications:** Replace browser `alert()` and basic text errors with a toast library (e.g., `react-hot-toast`) for cleaner feedback on Login/Register.
- [ ] **Loading Skeletons:** Add skeleton screens while fetching Events/Details instead of a simple "Loading..." text.

## Operational Features (Future)
- [ ] **QR Code Generation:** Generate unique QR codes for tickets upon purchase.
- [ ] **Mobile Scanning App:** dedicated view for scanning ticket QR codes at the gate.