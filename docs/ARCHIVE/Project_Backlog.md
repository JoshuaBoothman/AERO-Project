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
- [ ] **Schema Enhancement:** Consider adding `semantic_success_color` and `semantic_neutral_color` to `organization_settings`. 
    * *Reason:* Currently, we derive "Active" status from `primary_color`. If a brand's primary color is Red, the "Active" badge looks like a warning. Separate semantic fields allow for "Brand = Red" but "Success = Green".
- [ ] **Refactor:** The `secondary_color` in `organization_settings` defaults to `#FFFFFF` in `Layout.jsx`. This makes it unusable for borders or text on white backgrounds. We should clarify if this is a "Background" or "Brand" color in the definitions.

## Operational Features (Future)
- [ ] **QR Code Generation:** Generate unique QR codes for tickets upon purchase.
- [ ] **Mobile Scanning App:** dedicated view for scanning ticket QR codes at the gate.

### Technical Debt
* **Refactor:** `createOrder.js` is becoming a "God Function". Logic should be extracted into a dedicated `services/OrderService.js` to handle transaction complexity.
* **CSS Architecture:** Global styles in `index.css` are risky. Migrate component-specific styles (like `.event-banner`, `.status-badge`) to CSS Modules or a Tailwind implementation to prevent regression.

### Schema Enhancements
* **Theming:** Add `semantic_success_color` and `semantic_neutral_color` to `organization_settings`. Relying solely on `primary_color` for UI state (like "Active") risks accessibility issues if the brand color is red/orange.
* **Security:** Replace random string `ticket_code` generation with cryptographically secure UUIDs or signed JWTs for ticket validation.