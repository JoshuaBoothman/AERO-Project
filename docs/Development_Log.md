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

### Documentation (Planning)
*   **Created:** `docs/Future_Feature_Requirements.md` - Roadmap for Campsites, Mechandise, Asset Hire.
*   **Created:** `docs/Pilot_Logic_Deep_Dive.md` - Specifications for "My Hangar" and Flight Line Duties.

## [2025-12-27] - Order History & Attendee Management (Part 1)
**Milestone:** Implemented "My Orders" and "Order Details" Views

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `getUserOrders` endpoint (fetches user's purchase history securely).
    *   **Feature:** Created `getOrderDetail` endpoint (fetches specific order with tickets/attendees).
    *   **Security:** Implemented specific `user_id` checks to ensure users can only view their own orders.
* **Frontend (Client)**
    *   **Page:** Created `MyOrders.jsx` - List view of past transactions.
    *   **Page:** Created `OrderDetail.jsx` - Detailed view showing Ticket Types, and assigned Pilots/Crew.
    *   **Navigation:** Added "My Orders" link to `Layout.jsx` (User Menu).
    *   **Routing:** Registered new routes in `App.jsx`.


### [2025-12-27] - Order History & Attendee Management (Part 2)
**Milestone:** Attendee Assignment Logic

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `updateAttendee` endpoint (`PUT /api/attendees/:id`).
    *   **Security:** Added ownership validation (User -> Order -> OrderItem -> Attendee).
* **Frontend (Client)**
    *   **Feature:** Implemented Inline Edit Mode in `OrderDetail.jsx`.
    *   **UI/UX:** Aligned "Edit Details" button with "Registered" status badge for visual consistency.
    *   **Refactor:** Converted `tickets-list` item actions to a flex-column layout.
    *   **Feature:** Added `react-qr-code` to `OrderDetail.jsx` for scannable gate entry.

### Next Steps
*   **Campsite Booking:** Interactive map/list for booking spots.
*   **Merchandise:** E-commerce store.

## [2025-12-27] - Campsite Admin Map Tool
**Milestone:** Campground Mapping Foundation

### Completed Items
* **Database**
    *   **Seeding:** Seeded "North Field" campground (`test-map.jpg`) and 5 campsites.
    *   **Tooling:** Created temporary seeding endpoint to bypass direct connection issues.
* **Backend (API)**
    *   **Features:** Implemented `getCampgrounds`, `getCampsites`, and `updateCampsiteCoords`.
    *   **Fix:** Resolved API crash (500 Error) by fixing `recordset` property access on array results.
* **Frontend (Client)**
    *   **Feature:** Created `AdminMapTool.jsx` for defining campsite locations on a map image.
    *   **Navigation:** Added `/admin/map` route.
    *   **Logic:** Implemented dynamic fetching of campground data (removes hardcoded IDs).

### Next Steps
*   **User Booking:** Build the frontend interface for users to book specific sites.

## [2025-12-28] - Admin Map Tool Enhancements
**Milestone:** Campsite Admin Map Tool (v1)

### Completed Items
*   **Features (Backend)**
    *   **Bulk Create:**  `createCampsites.js` (POST /api/campgrounds/{id}/sites) handles bulk addition with prefixes.
    *   **Update Site:** `updateCampsite.js` (PUT /api/campsites/{id}) handles renaming and unmapping.
    *   **Delete Site:** `deleteCampsite.js` (DELETE /api/campsites/{id}).
*   **UI/UX (Frontend)**
    *   **Grid Layout:**  `AdminMapTool.jsx` sites list converted to a responsive CSS grid.
    *   **Bulk Add UI:** Added inputs for Qty and Prefix to quickly generate sites.
    *   **Interaction Refinement:** 
        *   Maintained selection focus after pinning for rapid mapping.
        *   Added "click pin to select" functionality.
        *   Fixed map container offset issues for accurate pin placement.
    *   **Theming:** integrated `organization_settings` colors (Primary, Accent) for dynamic button and pin styling.



## [2025-12-28] - Admin UX & Role Logic
**Milestone:** Role-Based Navigation & Enhanced Admin Tools

### Completed Items
*   **Backend (API)**
    *   **Auth Logic:** Updated `authLogin.js` to correctly authenticate against the `admin_users` table before falling back to `users`.
    *   **New Endpoint:** Created `createCampground.js` (POST /api/campgrounds) to allow Admins to generate new campground entities.
    *   **Fix:** Aligned `authLogin` and `createCampground` queries with the actual SQL Schema (corrected column names `admin_user_id` and removed non-existent `capacity`).
*   **Frontend (Client)**
    *   **Navigation:** Updated `Layout.jsx` to implement Role-Based Access Control (RBAC) in the header.
        *   **Admins:** See "Admin Map", "Cart" is hidden.
        *   **Users:** See "Cart", "Admin Map" is hidden.
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

### Documentation (Planning)
*   **Created:** `docs/Future_Feature_Requirements.md` - Roadmap for Campsites, Mechandise, Asset Hire.
*   **Created:** `docs/Pilot_Logic_Deep_Dive.md` - Specifications for "My Hangar" and Flight Line Duties.

## [2025-12-27] - Order History & Attendee Management (Part 1)
**Milestone:** Implemented "My Orders" and "Order Details" Views

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `getUserOrders` endpoint (fetches user's purchase history securely).
    *   **Feature:** Created `getOrderDetail` endpoint (fetches specific order with tickets/attendees).
    *   **Security:** Implemented specific `user_id` checks to ensure users can only view their own orders.
* **Frontend (Client)**
    *   **Page:** Created `MyOrders.jsx` - List view of past transactions.
    *   **Page:** Created `OrderDetail.jsx` - Detailed view showing Ticket Types, and assigned Pilots/Crew.
    *   **Navigation:** Added "My Orders" link to `Layout.jsx` (User Menu).
    *   **Routing:** Registered new routes in `App.jsx`.


### [2025-12-27] - Order History & Attendee Management (Part 2)
**Milestone:** Attendee Assignment Logic

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `updateAttendee` endpoint (`PUT /api/attendees/:id`).
    *   **Security:** Added ownership validation (User -> Order -> OrderItem -> Attendee).
* **Frontend (Client)**
    *   **Feature:** Implemented Inline Edit Mode in `OrderDetail.jsx`.
    *   **UI/UX:** Aligned "Edit Details" button with "Registered" status badge for visual consistency.
    *   **Refactor:** Converted `tickets-list` item actions to a flex-column layout.
    *   **Feature:** Added `react-qr-code` to `OrderDetail.jsx` for scannable gate entry.

### Next Steps
*   **Campsite Booking:** Interactive map/list for booking spots.
*   **Merchandise:** E-commerce store.

## [2025-12-27] - Campsite Admin Map Tool
**Milestone:** Campground Mapping Foundation

### Completed Items
* **Database**
    *   **Seeding:** Seeded "North Field" campground (`test-map.jpg`) and 5 campsites.
    *   **Tooling:** Created temporary seeding endpoint to bypass direct connection issues.
* **Backend (API)**
    *   **Features:** Implemented `getCampgrounds`, `getCampsites`, and `updateCampsiteCoords`.
    *   **Fix:** Resolved API crash (500 Error) by fixing `recordset` property access on array results.
* **Frontend (Client)**
    *   **Feature:** Created `AdminMapTool.jsx` for defining campsite locations on a map image.
    *   **Navigation:** Added `/admin/map` route.
    *   **Logic:** Implemented dynamic fetching of campground data (removes hardcoded IDs).

### Next Steps
*   **User Booking:** Build the frontend interface for users to book specific sites.

## [2025-12-28] - Admin Map Tool Enhancements
**Milestone:** Campsite Admin Map Tool (v1)

### Completed Items
*   **Features (Backend)**
    *   **Bulk Create:**  `createCampsites.js` (POST /api/campgrounds/{id}/sites) handles bulk addition with prefixes.
    *   **Update Site:** `updateCampsite.js` (PUT /api/campsites/{id}) handles renaming and unmapping.
    *   **Delete Site:** `deleteCampsite.js` (DELETE /api/campsites/{id}).
*   **UI/UX (Frontend)**
    *   **Grid Layout:**  `AdminMapTool.jsx` sites list converted to a responsive CSS grid.
    *   **Bulk Add UI:** Added inputs for Qty and Prefix to quickly generate sites.
    *   **Interaction Refinement:** 
        *   Maintained selection focus after pinning for rapid mapping.
        *   Added "click pin to select" functionality.
        *   Fixed map container offset issues for accurate pin placement.
    *   **Theming:** integrated `organization_settings` colors (Primary, Accent) for dynamic button and pin styling.



## [2025-12-28] - Admin UX & Role Logic
**Milestone:** Role-Based Navigation & Enhanced Admin Tools

### Completed Items
*   **Backend (API)**
    *   **Auth Logic:** Updated `authLogin.js` to correctly authenticate against the `admin_users` table before falling back to `users`.
    *   **New Endpoint:** Created `createCampground.js` (POST /api/campgrounds) to allow Admins to generate new campground entities.
    *   **Fix:** Aligned `authLogin` and `createCampground` queries with the actual SQL Schema (corrected column names `admin_user_id` and removed non-existent `capacity`).
*   **Frontend (Client)**
    *   **Navigation:** Updated `Layout.jsx` to implement Role-Based Access Control (RBAC) in the header.
        *   **Admins:** See "Admin Map", "Cart" is hidden.
        *   **Users:** See "Cart", "Admin Map" is hidden.
    *   **Admin Map Tool:** 
        *   **UX Fix:** Solved Map Image overflow issue with responsive CSS.
        *   **Feature:** Added "Create Campground" button and Modal to the Admin interface.
        *   **Security:** Added Route Protection to redirect unauthorized users to Login.
*   **Verification**
    *   Verified End-to-End Admin flow (Login -> Create Campground -> View Map).
    *   Verified User flow (Login -> Restricted Access).

## [2026-01-04] - Campsite Booking & Admin Map Refinement
**Milestone:** End-to-End Campsite Booking & Admin Layout Polish

### Completed Items
*   **Backend (API)**
    *   **Feature:** Updated `getCampsites` to accept `startDate`/`endDate` query params and return `is_booked` status.
    *   **Delete Logic:** Implemented `deleteCampground.js` to allow admins to remove campgrounds (and associated sites).
    *   **Image Upload:** Implemented `uploadImage` function for campground maps.
*   **Frontend (Admin Map)**
    *   **UI Polish:** Fixed layout issues where the "Bulk Add" inputs were overlapping the map.
    *   **Feature:** Implemented Campground Auto-Selection after creation.
    *   **Feature:** Added Delete Campground functionality.
    *   **Fix:** Resolved logout redirection issue (now redirects to Home).
*   **Frontend (User Booking)**
    *   **Feature:** Integrated `CampsiteModal` into `EventDetails.jsx` for user-facing booking.
    *   **State:** Implemented `campsiteCart` to handle multiple site bookings in one order.
    *   **Logic:** Implemented date-based availability checking (Green/Red pins).
    *   **Fix:** Resolved "Flickering" issue where campground selection reset on date change (Stabilized `useEffect` dependencies).
    *   **Fix:** Resolved "Confirm Button Disabled" issue by adding missing `handleAddToCartCampsites` function.
*   **Verification**
    *   Verified Admin Map image uploading and site plotting.
    *   Verified User flow: Login -> Event -> Book Site -> Change Date -> Confirm -> Checkout.

### Next Steps

*   **Merchandise Integration:**
    *   **Plan:** Follow [Merchandise_Implementation_Plan.md](Merchandise_Implementation_Plan.md).
    *   **Phase 1 (Admin):** Schema updates, Product/Variant Management, Image Uploads, Event Pricing.
    *   **Phase 2 (User):** Storefront UI, Cart Logic, Order Processing.
*   **Payment Integration:** (Deferred) Connect Stripe/PayPal.
## [2026-01-10] - Shopping Cart Skeleton & Admin Dashboard
**Milestone:** Complete Shopping Cart Functionality & Admin Order Management

### Completed Items
*   **Backend (API)**
    *   **Unified Checkout:** Updated `createOrder.js` to handle `Merchandise`, `Asset`, and `Subevent` item types in a single transaction.
    *   **Admin API:** Created `getAdminOrders.js` to fetch all orders with event details (RESTRICTED to admins).
    *   **Asset Logic:** Implemented `getAssetAvailability.js` and `getAssetTypes.js` for hireable items.
    *   **Fix:** Resolved `CK_AttendeeStatus` constraint violation by defaulting attendee status to 'Registered'.
    *   **Fix:** Corrected `seed_demo_data.js` to properly populate Asset Inventory.
*   **Database**
    *   **Seeding:** Added `product_variants` (Sizes), `asset_items` (Generators), and `subevents` (Gala Dinner).
    *   **Constraints:** Verified foreign key relationships and status constraints.
*   **Frontend (Client)**
    *   **Store Page:** Created unified `StorePage.jsx` with tabs for Merchandise, Hire, and Program.
    *   **Checkout:** Implemented centralized `CartContext` and `Checkout.jsx` handling mixed baskets.
    *   **Admin Dashboard:** Created `AdminOrders.jsx` table view with status filtering and details link.
    *   **UX:** Added context-aware "Back" navigation (Admins -> All Orders, Users -> My Orders).
*   **Verification**
    *   Verified end-to-end flow: Add T-Shirt + Generator + Dinner -> Mock Pay -> Order Created -> Admin View.
    *   Verified "No Assets Available" error was resolved by fixing seeding logic.

### Next Steps
*   **UI/UX Polish:** Styling overhaul for Store, Cart, and Admin Dashboard.

## [2026-01-10] - UI/UX Polish & Tailwind Migration
**Milestone:** Implemented Tailwind CSS v4 and established a cohesive Design System

### Completed Items
*   **Tech Stack (Frontend)**
    *   **Migration:** Installed **Tailwind CSS v4** and configured `@tailwindcss/vite` plugin.
    *   **Theming:** Implemented Dynamic Branding using CSS variables (`--primary-color`, `--accent-color`) injected from `orgSettings`.
    *   **Refactor:** Removed legacy `index.css` manual styles in favor of utility classes.
*   **UI/UX (Client)**
    *   **Layout:** Built responsive Navigation Bar with Sticky Header and mobile-friendly spacing.
    *   **Store:** Refactored `StorePage.jsx` with a clean Tabbed Interface (Merch/Hire/Program) and responsive Grid layouts.
    *   **Checkout:** Designed a modern "Order Summary" card with clear typography and interactions.
    *   **Admin Dashboard:** Styled the Orders Table with consistent padding and color-coded Status Badges (Paid/Pending/Failed).

### Next Steps
*   **Fresh Start:**
    *   Purge Database (retain Admin/User logins).
    *   Seed new event: **"Festival of Aeromodelling 2026"** (Inglewood, QLD, 4th-12th July 2026).
*   **Discovery UI:**
    *   Build dedicated "Browse" views for Products, Subevents, and Assets (currently hidden behind "Add to Cart").
    *   Create a cohesive end-to-end experience for Users (Discovery -> Cart -> Checkout) and Admins (Setup -> Management).

## [2026-01-10] - Fresh Start (API Recovered)
**Milestone:** Database Reset Complete, API Restored & Functional

### State of play
*   **Database**: 
    *   Successfully purged all transactional data (while preserving Users/Admins).
    *   Previously incompatible tables ('campsites', 'campground_sections') were dropped and recreated with new schema structure.
    *   Successfully seeded "Festival of Aeromodelling 2026" event, including Products, Assets, Subevents, and Campgrounds.
    *   Verified via script output that seeding completed (Exit Code 0).
*   **API (Backend)**:
    *   The API service is currently failing to serve requests (returning 404 for all endpoints, including basic debug routes).
    *   `npm start` executes successfully, and the Functions Runtime (func.exe) launches.
    *   However, no functions are being registered/loaded by the runtime, despite correct file placement in `src/functions/`.
    *   `debug_test_v4.js` was created to test isolation; `node` can execute it without syntax errors, but `func` ignores it.
    *   `npm install` was re-run cleanly.
*   **Frontend (Client)**:
    *   `npm run dev` is operational.
    *   Camping Page UI verification was blocked by the API unavailability.



### API Recovery (Resolved)
*   [x] **Debug API Environment**: Investigated failure to load functions.
    *   **Root Cause:** `src/functions/dummy.js` was saved with unsupported encoding (**UTF-16LE**), causing the Node.js Worker to crash silently or with opaque syntax errors (`SyntaxError: Invalid or unexpected token`).
    *   **Investigation Path:**
        1.  Verified `local.settings.json` format (found valid).
        2.  Attempted `npm install` and `func start --verbose` (failed to show clear error due to crash).
        3.  Isolating using `debug_test_v4.js` (initially failed to load).
        4.  Captured `std_err` to a log file which revealed the encoding error pointing to `dummy.js`.
    *   **Fix:** Deleted `dummy.js`.
    *   **Verification:** `func start` now successfully loads all functions. `GET /api/campgrounds` returns 200 OK.
    *   **Lesson Learned:** **Always ensure files in the API directory are saved as UTF-8.** The Azure Functions Node.js worker is extremely sensitive to file encoding and crashes the entire worker process if it encounters a UTF-16/UCS-2 file, often masking the error unless logs are explicitly captured.

### Next Steps (Resuming)
*   **Camping Page:** Verify UI integration with the now-working backend.
*   **Discovery UI:** Continue building Browse views.

## [2026-01-10] - Admin Merchandise & Global UI Enhancements
**Milestone:** SKU Management Refinement, Image Uploads, and Global Notification System

### Completed Items
*   **Backend (API)**
    *   **SKU Management:**
        *   Fixed `getProductDetails` to return `image_url` for SKUs, resolving thumbnail display issues.
        *   Updated `deleteSKU` to safely handle deletion by first removing `event_skus` links (Availability).
        *   Refined Error Handling in `deleteSKU` to return transparent error messages (e.g., blocking deletion if SKU is purchased).
        *   Fixed logging syntax error (`context.log.error` -> `context.error`) in Azure Functions v4.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **Image Upload:** Implemented seamless image upload for both Base Product and Individual SKUs via `api/upload`.
        *   **SKU List:** Added "Delete" button (Red X) to SKU rows.
        *   **UX:** Removed unused "Barcode" column for cleaner layout.
        *   **Feedback:** Replaced `alert()` and `window.confirm()` with custom global notifications.
    *   **Global UI System:**
        *   **NotificationContext:** Created a global context provider for managing Toast Notifications and Confirmation Modals.
        *   **ToastContainer:** Implemented a sleek, animated toast notification system (Success/Error/Info) replacing browser alerts.
        *   **ConfirmationModal:** Implemented a styled modal for critical actions (e.g., "Delete SKU").
    *   **Fixes:**
        *   Resolved `App.jsx` "White Screen" regression caused by duplicate `BrowserRouter` tags and improper Provider nesting.
        *   Fixed `index.css` syntax error (missing closing brace).

### Next Steps
*   **Admin Asset Hires:** Implement the admin side of asset management.



## [2026-01-10] - Event Visibility & Asset Admin Fixes
**Milestone:** Resolved Asset Management Event Dropdown & API Routing

### Completed Items
*   **Backend (API)**
    *   **Fix:** `getEvents.js` - Changed `INNER JOIN` to `LEFT JOIN` on `venues`. This fixed the issue where events without venues were hidden from the public/dropdown list.
    *   **Fix:** `getEvents.js` - Added missing `route: 'events'` configuration. This resolved the 404 error when accessing `/api/events`.
    *   **Fix:** `getEvents.js` & `getEventDetail.js` - Added `is_public_viewable` to the SELECT columns. This resolved the issue where the "Publicly Viewable" checkbox state was not persisting or being respected.
    *   **Enhancement:** Added better logging to `getEvents.js` to assist in debugging admin vs public context execution.
*   **Verification**
    *   Verified "Event Context" dropdown in Asset Types now populates correctly.
    *   Verified "Publicly Viewable" checkbox state persists after saving.
    *   Verified `/api/events` endpoint responds with 200 OK.


## [2026-01-11] - Merchandise Enhancements
**Milestone:** End-to-End Option & Category Management with Optimistic UX

### Completed Items
*   **Backend (API)**
    *   **Feature:** Implemented `deleteVariantOption.js` (DELETE /api/options/{id}).
        *   **Logic:** Enforced cascading deletion: Deleting an option ("Small") automatically deletes all associated SKUs from `product_skus`, `sku_option_links`, and `event_skus`.
        *   **Response:** Returns `deletedSkuIds` to enable frontend optimistic updates.
    *   **Feature:** Implemented `deleteProductVariant.js` (DELETE /api/variants/{id}).
        *   **Safeguard:** Enforced `409 Conflict` if the category is not empty. Users must manually delete options first.
        *   **Cleanup:** Automatically deletes the global `variant_categories` record if the deleted category was the last usage of that name (orphan cleanup).
    *   **Enhancement:** Updated `manageProductOptions.js` to return the full option object (including the new ID) upon creation, enabling instant UI updates.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **UX (Options):** Added "Delete" (X) button to option pills.
        *   **UX (Categories):** Added "Remove Category" button to Variant Card headers.
        *   **Optimistic UI:** Implemented local state management for Add/Delete actions. Updates appear instantly without triggering a page reload (`fetchDetails`), improving perceived performance.
        *   **Feedback:** Integrated `NotificationContext` to handle confirmation prompts and error messages (e.g., "Delete all options first").
*   **Verification**
    *   **Backend:** Verified cascading delete logic via custom database script `test_cascade_logic.js`.
    *   **Frontend:** Verified optimistic updates for adding/deleting options and categories.
    *   **Safeguards:** Verified that trying to delete a populated category triggers the correct warning.

### Next Steps
*   **User Flow:** Allow users to select these merchandise options during the booking flow.

## [2026-01-11] - Campground Management
**Milestone:** Implemented Campground Renaming Logic in Admin Map Tool

### Completed Items
*   **Backend (API)**
    *   **Feature:** Created `updateCampground.js` (PUT /api/campgrounds/{id}) to handle renaming campgrounds.
*   **Frontend (Client)**
    *   **Admin Map Tool:**
        *   **UI:** Replaced browser prompt with a custom, styled Modal for renaming campgrounds.
        *   **Feedback:** Added visual border to modal input to improve usability.
        *   **Logic:** Implemented seamless state updates to reflect name changes instantly on the tab bar.
*   **Verification**
    *   Verified renaming flow (Open Modal -> Edit -> Save -> Update) persists correctly via API.

## [2026-01-11] - Ticket Management & Dev Ops
**Milestone:** Event Ticket CRUD & Local Environment Fixes

### Completed Items
*   **Backend (API)**
    *   **Feature:** Created `ticketTypes.js` (CRUD endpoints for `event_ticket_types`).
    *   **Logic:** Implemented `GET`, `POST`, `PUT`, `DELETE` operations secured by Admin Role check (via context).
*   **Frontend (Client)**
    *   **Event Form:** Added a "Ticket Types" management section to `EventForm.jsx`.
        *   **UI:** Listed tickets in a table with badges for "Pilot" and "Crew" roles.
        *   **Interaction:** Created a modal for Adding/Editing ticket details (Name, Price, System Role).
        *   **Logic:** Implemented API integration for seamless CRUD operations without page reloads.
*   **Dev Ops (Localhost)**
    *   **Fix:** Resolved "White Screen / 404" errors on `localhost:5173`.
    *   **Root Cause:** A stale Service Worker from a previous project version was intercepting requests.
    *   **Resolution:** Unregistered the "zombie" Service Worker in the browser.

### Next Steps
*   **Subevents:** Implement CRUD for Subevents (Dinners, etc.) in the Event Form.

## [2026-01-12] - Event Portal UX Refinement
**Milestone:** Home Page Redirection & Event Details Styling

### Completed Items
* **Frontend (Client)**
    *   **Home Page:** Implemented smart redirection. Visiting `/` now auto-redirects to the Next upcoming event (or Current event if active).
    *   **Event Details UI:**
        *   **Refactor:** Removed legacy "Back" button and "Status" badge for a cleaner look.
        *   **Typography:** Centered and enlarged the Event Title.
        *   **Layout:** Centered key content width for better readability.
        *   **Buttons:** Removed "Book Campsite" button.
        *   **CTA:** Styled "Get Tickets" button to be more prominent and centered.
    *   **Security:** "Get Tickets" button now strictly redirects unauthenticated users to `/login`.
    *   **Fix:** Resolved CSS `white-space` issue where line breaks in Event Descriptions were being ignored. Applied fix to both List and Details views.


## [2026-01-12] - Email Verification
**Milestone:** Secure User Registration with Resend Integration

### Completed Items
* **Technology Stack**
    *   **Service:** Integrated **Resend** for transactional emails (Free Tier: 100/day).
    *   **Library:** Installed `resend` NPM package in API.
* **Backend (API)**
    *   **Database:** Added `verification_token` and `verification_token_expires` to `users` table.
    *   **Registration:** Updated `authRegister` to:
        *   Generate a secure hex token.
        *   Create user with `is_email_verified = 0`.
        *   Send an HTML email containing a verification link.
    *   **Creation:** Created `api/src/lib/emailService.js` abstraction.
    *   **Verification:** Created `authVerifyEmail` endpoint to validate token and activate user.
    *   **Login:** Updated `authLogin` to block unverified users (`403 Forbidden`).
* **Frontend (Client)**
    *   **Registration:** Updated `Register.jsx` to show a "Check your email" success state instead of auto-redirecting.
    *   **Verification:** Created `VerifyEmail.jsx` to handle the `?token=XYZ` link from the email.
* **Verification**
    *   Verified end-to-end flow: Register -> Receive Email -> Click Link -> Verification Success -> Login.

### Going Live Instructions (Resend)
When ready to deploy to production with a real domain:
1.  **Add Domain:** Go to [Resend Dashboard](https://resend.com/domains) > Add Domain.
2.  **DNS:** Add the provided DKIM/SPF records to your DNS provider (Cloudflare, GoDaddy, etc.).
3.  **Verify:** Click "Verify" in Resend (can take up to 48h, usually instant).
4.  **Update Code:**
    *   Open `api/src/lib/emailService.js`
    *   Update the `from` address: `from: 'Aeromodelling <noreply@yourdomain.com>'`


## [2026-01-12] - Admin User Management
**Milestone:** User Administration & Account Lockout

### Completed Items
* **Database**
    *   **Schema:** Added is_locked column to users table.
* **Backend (API)**
    *   **New Endpoints:**
        *   GET /api/manage/users: Fetches list of all registered users (masked sensitive data).
        *   PUT /api/manage/users/{id}/status: Updates is_locked status.
    *   **Security:**
        *   Secured new endpoints with Admin authentication.
        *   Updated uthLogin to check is_locked status and return 403 Forbidden if locked.
    *   **Bug Fix:** Identified and resolved issue where is_email_verified check was being ignored in uthLogin due to missing column in SELECT query. Fixed query to include necessary flags.
* **Frontend (Client)**
    *   **Admin Dashboard:** Added "Manage Users" tab to System Settings.
    *   **UI:** Created UserList.jsx to display registered users with status indicators (Verified/Pending, Active/Locked).
    *   **Interaction:** Implemented Lock/Unlock functionality with optimistic UI updates.
    *   **Login:** Updated Login.jsx to display actual server error messages (e.g., "Account is locked", "Please verify email") instead of generic "Invalid Credentials".


## [2026-01-12] - Store UI & Global Merchandise Flow
**Milestone:** Storefront Modernization & Global SKU Access

### Completed Items
*   **Merchandise Architecture**
    *   **Refactor:** Decoupled Merchandise from specific Events. Products are now "Global" by default.
    *   **Logic:** Updated `getStoreItems` to fetch all active `product_skus`, removing the strict `event_skus` join.
    *   **Transactions:** Updated `createOrder.js` to process orders using `product_sku_id` directly, simplifying inventory management.
*   **Storefront UI/UX**
    *   **Visual Overhaul:** Replaced the dense list view with a clean **Product Grid**.
    *   **Interaction:** Introduced a **Product Modal** for item selection.
        *   **Dynamic Options:** Dropdowns (Size/Color) are generated dynamically from API data.
        *   **Real-time Feedback:** Price and Stock status update instantly based on user selection.
        *   **Smart Imaging:** Modal image updates to the specific SKU image (if available) when options are selected.
    *   **Components:** Created reusable `ProductCard.jsx` and `ProductModal.jsx` components.
*   **Backend (API)**
    *   **Data Structure:** Enhanced `getStoreItems` response to return nested `options` (for dropdowns) and `variant_map` (for logic).
    *   **Images:** Added `image_url` support to individual SKUs in the API response.

## [2026-01-12] - Azure Storage Migration
**Milestone:** Scalable Image Hosting for Serverless Environment

### Completed Items
* **Infrastructure**
    *   **Azure Storage:** Set up a dedicated Storage Account (`aeroprojectstorage`) and `uploads` container.
    *   **Configuration:** Added `BLOB_STORAGE_CONNECTION_STRING` to `local.settings.json`.
* **Backend (API)**
    *   **Dependencies:** Installed `@azure/storage-blob`.
    *   **Refactor:** Rewrote `uploadImage.js` to upload files directly to Azure Blob Storage instead of the local filesystem.
    *   **Security:** Configured public read access for the `uploads` container to serve images globally.
* **Frontend (Client)**
    *   **Verification:** Confirmed that `ProductCard` and `EventDetails` components correctly render images served from absolute Azure URLs (`https://...`).
* **Verification**
    *   **Upload Test:** Verified that uploading a file via the API successfully stores it in Azure and returns a valid, accessible URL.

## [2026-01-12] - Azure Upload Debugging
**Milestone:** Resolved "500 Internal Server Error" on Live Azure Environment

### The Issue
*   Image uploads were working locally but failing silently on the deployed Azure Static Web App.
*   **Error 1:** The error handler was crashing because `context.log.error` is valid in v3 but invalid in v4 (should be `context.error`).
*   **Error 2:** The underlying error was `ReferenceError: crypto is not defined`. The Azure Storage SDK requires `global.crypto`, which was missing in the Azure Functions Node environment.

### The Fix
*   **Backend (API)**
    *   **Polyfill:** Added a global polyfill for `crypto` in `uploadImage.js` to satisfy SDK requirements.
    *   **Refactor:** Fixed logging syntax to use `context.error` and `context.warn`.
    *   **Verification:** Confirmed uploads now work successfully in the live environment.


## [2026-01-12] - Hire Assets Features
**Milestone:** Asset Image Display, Selection, and Availability Checking

### Completed Items
*   **Database**
    *   **Schema:** Added `image_url` column to `asset_items` table.
*   **Backend (API)**
    *   **Features:**
        *   Updated `manageAssetItems.js` to support creating/editing items with `image_url`.
        *   Updated `getStoreItems.js` to return asset type images.
        *   Created `getAssetAvailability.js` to fetch available items for a date range, preventing double bookings.
    *   **Fix:** Resolved 'Invalid column name status' error in availability check by relying on `asset_hires` dates.
*   **Frontend (Client)**
    *   **Admin Dashboard:**
        *   Updated `AssetItems.jsx` to support editing items and uploading specific item images (e.g. for damage/condition tracking).
        *   Added thumbnail display to the items list.
    *   **Storefront:**
        *   **Asset Selection:** Implemented `AssetSelectionModal` to allow users to view and select specific available items (e.g. specific serial numbers).
        *   **Availability:** Integrated date-based availability checking to hide booked items.
        *   **Image Fallback:** Implemented logic to show Asset Item image -> Asset Type image -> No Image placeholder.
        *   **Consistency:** Updated all modals (`ProductModal`, `CampsiteModal`, `AssetSelectionModal`) to use consistent `lucide-react` icons.
    *   **Pricing & Logic:**
        *   **Date Check:** Updated day count logic to be inclusive (e.g., 1st to 2nd = 2 days) in both the modal and `StorePage`.

## [2026-01-14] - Mobile Optimization
**Milestone:** Responsive "Mobile-First" UI Overhaul

### Completed Items
*   **Technology Stack**
    *   **Icons:** Integrated `lucide-react` for responsive hamburger menu and cross-platform consistency.
*   **Frontend (Layout & Navigation)**
    *   **Hamburger Menu:** Implemented a slide-out mobile navigation drawer replacing the hidden desktop menu.
    *   **Responsive Header:** 
        *   Designed a "Stacked" layout for mobile: Logo + Menu Button on top row, Organization Name wrapping to full width on second row.
        *   Ensured proper alignment and sizing of the Cart icon on mobile.
    *   **Bleed Tabs:** Refactored `StorePage` tabs to scroll edge-to-edge on mobile while maintaining visual padding (no cut-off text).
*   **Frontend (Views)**
    *   **Event Details:**
        *   Made Hero Banner responsive (auto-height).
        *   Adjusted typography for smaller screens.
        *   Stacked "Get Tickets" button vertically on mobile.
    *   **Events List:** Converted Event Cards to a vertical stack (Image Top / Content Bottom) on mobile.
    *   **Product Modal:** Optimized padding and layout to fit small screens without scrolling issues.
    *   **Checkout:** Improved list item readability on mobile by introducing vertical stacking and ensuring the "Remove" button is always visible (no hover required).
*   **Verification**
    *   Verified responsive behavior on multiple mobile breakpoints.
    *   Confirmed no horizontal scrolling or truncated content across the app.

## [2026-01-13] - Camping Page Fix
**Milestone:** Resolved Critical Camping Page Bug

### The Issue
The "Camping" page for "Festival of Aeromodelling 2026" was displaying "No campgrounds found for this event." despite campgrounds existing in the database.

### The Fix
* **Backend (API):**
    *   **Bug Found:** `getCampgroundAvailability` contained a SQL query error. It was attempting to select a column `c.name` from the `campsites` table, but the correct column name is `c.site_number`.
    *   **Resolution:** Corrected the SQL query to select `c.site_number` as `site_number`.
    *   **Verification:** Verified by calling the API directly and confirming it now returns the campground data correctly.



### Next Steps
*   **Checkout:** Ensure the correct price (Daily Rate * Days) is passed to the cart and checkout flow.

## [2026-01-13] - Merchandise Delete & Archive Logic
**Milestone:** Implemented safe deletion and archiving workflows for products.

### Completed Items
*   **Backend (API)**
    *   **New Endpoint:** `deleteProduct.js` (DELETE /api/products/{id}).
        *   **Validation:** Blocks deletion if the product has existing Orders (`409 HAS_ORDERS`).
        *   **Warning:** Blocks deletion if the product has SKUs (`409 HAS_SKUS`) unless `force=true`.
        *   **Cleanup:** Performs cascading delete of Product -> Variants -> Options -> SKUs.
    *   **Enhancement:** Updated `getProducts.js` to remove the default `is_active=1` filter, allowing Admins to view archived products.
    *   **Fix:** Identified that `products.is_published` column does not exist, corrected legacy checks.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **Actions:** Added "Archive", "Unarchive", and "Delete" buttons to the bottom of the "Info" tab.
        *   **UX:** Implemented smart confirmation logic:
            *   "Has Orders" -> Suggests Archiving.
            *   "Has SKUs" -> Double confirmation warning about data loss.
    *   **Merchandise List:**
        *   **Filtering:** Added "Show Archived" checkbox to toggle visibility of archived items.
        *   **Status:** Removed incorrect "Draft" badge; Added clear "Archived" badge.
*   **Verification**
    *   Verified archiving hides products from the list (unless filter is active).
    *   Verified unarchiving restores products.
    *   Verified deletion works for clean products and forces confirmation for products with SKUs.
    *   Verified products with orders cannot be deleted and prompt for archiving.


## [2026-01-16] - Resend Configuration & Database Cleanup
**Milestone:** Fixed Live Registration Error and Cleaned Development/Live Databases

### Completed Items
*   **Backend (API)**
    *   **Fix:** Resolved "Internal Server Error" on registration by robustly handling missing `RESEND_API_KEY`.
    *   **Refactor:** Moved `Resend` client initialization inside `sendVerificationEmail` to prevent module-load crashes.
    *   **Logic:** Added strict error checking: invalid JSON returns `400`, email failure deletes the pending user and returns `500` (prevents "ghost" users).
    *   **Config:** Verified domain sender address `registrations@meandervalleywebdesign.com.au`.
*   **Database Cleanup**
    *   **Scripting:** Created and executed safe cleanup scripts for both `sqldb-aero-dev` (Local) and `sqldb-aero-master` (Live).
    *   **Execution:**
        *   Preserved Admin (`admin@test.com`) and User (`jbsolutions@gmail.com`).
        *   Deleted all other users, admins, and cascading linked data (orders, attendees, transactions).
    *   **Verification:** Verified record counts on both environments.
*   **Verification**
    *   Confirmed registration API properly handles missing credentials without crashing the entire app.
    *   Confirmed clean state of both databases.

### Email Refinements
*   **Issues Addressed:**
    *   **Organization Name:** Now dynamically fetched from the database (`organization_settings`) instead of being hardcoded.
    *   **Sender Name:** Now matches the dynamic organization name.
    *   **Verification Link:** Now automatically derives the domain from the request's `Origin` header. Works seamlessly on both `localhost` and Live environments without needing manual configuration.
*   **Configuration:*   **Action Required:** User must add `SITE_URL` to Azure Application Settings.

### Debugging Fixes
*   **Organization Name:** Corrected SQL query to select `organization_name` instead of `name`.
*   **Client Routing:** Added `client/public/staticwebapp.config.json` to enable SPA fallback routing. This fixes the 404 error when visiting `/verify-email`.

### Next Steps
*   **Live Config:** User to add `RESEND_API_KEY` to Azure Function App settings.
*   **Testing:** Perform live user registration test.
