# Development Log

## [2025-12-22] - Initial Full-Stack Connection
**Milestone:** End-to-End Connectivity Established (DB -> API -> Frontend)

### Completed Items
* **Backend (API)**
    * Installed `mssql` driver.
    * Configured `local.settings.json` with Azure SQL connection string.
    * Created `api/src/lib/db.js` utility for reusable database connections.
    * Created `api/src/functions/getOrganization.js` endpoint.
* **Database (Azure)**
    * Verified connectivity to `sqldb-aero-master`.
    * Seeded `organization_settings` table with initial data.
* **Frontend (Client)**
    * Configured Vite Proxy to forward `/api` requests to localhost:7071.
    * Refactored `App.jsx` to introduce React Router.
    * Created `Layout.jsx` component for persistent Organization Header.
    * Created `Home.jsx` page.
    * Successfully fetching and displaying data from Azure SQL.

### Next Steps
* Build the "Events List" page.
* Create the "Event Details" view.

## [2025-12-22] - Public Events Module
**Milestone:** Public Events & Details Views Completed

### Completed Items
* **Database**
    * Seeded `venues` and `events` (Past, Active, Planned).
* **Backend (API)**
    * Created `getEvents`: Fetches public events sorted by date.
    * Created `getEventDetail`: Fetches single event by slug with venue details.
* **Frontend (Client)**
    * **Theming:** Updated `Layout.jsx` to expose organization colors as CSS variables (`--primary-color`, `--accent-color`).
    * **Events List:** Created `Events.jsx` with responsive grid layout and "Active" event highlighting.
    * **Event Details:** Created `EventDetails.jsx` with status-aware badges and dynamic button logic (View Recap vs Get Tickets).
    * **Routing:** Added dynamic route `/events/:slug`.

### Next Steps
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - UI Polish & Images
**Milestone:** Implemented Images and Refined Visual Hierarchy

### Completed Items
* **Database**
    * Added `banner_url` column to `events` table.
    * Seeded placeholder images for existing events.
* **Backend (API)**
    * Updated `getEvents` and `getEventDetail` to return image URLs.
* **Frontend (UI/UX)**
    * **Global Styles:** Switched background to soft blue-grey (`#f5f7fa`) to reduce contrast.
    * **Events List:** Refactored cards into a "Thumbnail + Content" row layout.
    * **Event Details:** Added full-width Hero Banner image.
    * **Buttons:** Established clear hierarchy with `.primary-button` (Active) and `.secondary-button` (View Only).

### Next Steps
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - Authentication Infrastructure
**Milestone:** User Registration & Login Flow

### Completed Items
* **Backend (API)**
    * Installed `bcryptjs` and `jsonwebtoken`.
    * Hardened `db.js` to use parameterized queries (SQL Injection protection).
    * Created `authRegister` endpoint (Hashes password, creates User).
    * Created `authLogin` endpoint (Validates credentials, returns JWT).
* **Frontend (Client)**
    * Implemented `AuthContext` for global user state management.
    * Created `Login.jsx` and `Register.jsx` pages.
    * Updated `Layout.jsx` to show "Login" vs "User Profile" based on state.

### Next Steps
* **Ticket Purchasing:** Connect the "Get Tickets" button in Event Details to a secure purchase flow.

## [2025-12-23] - Ticket Purchasing MVP
**Milestone:** End-to-End Ticket Purchase Flow (Mock Payment)

### Completed Items
* **Database**
    * Seeded `event_ticket_types` for the active event.
* **Backend (API)**
    * **Refactor:** Upgraded `db.js` to use Singleton Connection Pool pattern (Performance/Stability).
    * **Feature:** Created `createOrder` endpoint with atomic SQL Transactions (Orders + OrderItems + Attendees + Transactions).
    * **Update:** Modified `getEventDetail` to fetch and return available ticket types.
* **Frontend (Client)**
    * **UX:** Implemented "Ticket Selector" Modal in `EventDetails.jsx`.
    * **Logic:** Connected Checkout button to `createOrder` API.
    * **State:** Removed broken navigation flow; replaced with instant feedback Modal.

### Next Steps
* **Attendee Management:** Allow purchasers to assign specific names/emails to their tickets.
* **My Orders:** Create a User Profile view to see purchase history.

## [2025-12-23] - Attendee Management & UI Polish
**Milestone:** Attendee Data Capture & Visual Consistency

### Completed Items
* **Backend (API)**
    * **Feature:** Updated `createOrder` endpoint to process `attendees` array within the main transaction.
    * **Logic:** Implemented automatic 8-character `ticket_code` generation for each registered attendee.
    * **Data:** Verified insertion into `attendees` table linking to specific `order_items`.
* **Frontend (Client)**
    * **UX:** Implemented `AttendeeModal` workflow in `EventDetails.jsx`, intercepting checkout to collect Names/Emails per ticket.
    * **UI Core:** Implemented Global Box-Sizing Reset (`box-sizing: border-box`) to fix layout overflows.
    * **Visuals:** Standardized "Status Badges" to use Brand/Accent colors consistently across Events List and Details views.
    * **Fix:** Enforced strict aspect ratio and dimensions for Event Hero images to prevent layout shifts.

## [2025-12-25] - Registration Logic & Crew Linking
**Milestone:** Verified Registration Flow Recommendation & Implemented Post-Payment Crew Linking

### Completed Items
* **Database**
    * Verified `persons.user_id` is nullable.
    * Added `ticket_code` to `attendees` table (Unique identifier for linking).
    * Added `is_pit_crew` to `event_ticket_types`.
    * Seeded "Winter Warbirds 2026" with Pilot/Crew tickets for verification.
* **Backend (API)**
    * **Feature:** Implemented automatic 8-char `ticket_code` generation in `createOrder`.
    * **Logic:** Implemented "Pilot-Crew Linking" allowing crew to link to an existing Pilot via their `ticket_code`.
    * **Update:** Modified `getEventDetail` to return `is_pit_crew`.
* **Frontend (Client)**
    * **UX:** Updated `AttendeeModal` in `EventDetails.jsx` to show "Pilot Ticket Code" field for Crew tickets.
* **Verification**
    * Successfully tested manual Pilot creation (Code: `0URN9WME`).
    * Successfully tested manual Crew creation (Code: `1STM26T0`).
    * Confirmed database link in `pilot_pit_crews`.
    * Archived `Registration_Flow_Recommendation.md`.

### Next Steps
* **Attendee Assignment Flow:** Allow users to view purchased tickets and assign names/emails after purchase.

## [2025-12-26] - Enhanced Registration & Linking
**Milestone:** In-Cart Pilot-Crew Linking & Legacy Pilot Lookup

### Completed Items
* **Backend (API)**
    * **Feature:** Created `getUserEventAttendees` to fetch a user's previously registered pilots.
    * **Logic:** Refactored `createOrder.js` to support "In-Cart Linking" using temporary IDs.
    * **Fix:** Patched `createOrder.js` to ensure `persons` records are correctly linked to the authenticated `user_id`.
* **Frontend (Client)**
    * **UI:** Enhanced Pit Crew section in `EventDetails.jsx` with a smart Pilot Selector (In-Cart vs Registered vs Manual).
    * **State:** Implemented `myPilots` fetching and local state management.
* **Verification**
    * Validated In-Cart linking (Pilot + Crew in same order).
    * Validated Cross-Order linking (Crew linking to previously registered Pilot).
    * Fixed data issue where Pilot "Maverick" was unlinked from User.
