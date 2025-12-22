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