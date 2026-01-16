# AERO Project Context
Generated on: 2026-01-15T21:26:23.603Z

## Project Structure
```
├── .gitignore
├── api
│   ├── .funcignore
│   ├── .gitignore
│   ├── api_log.txt
│   ├── api_test.txt
│   ├── create_admin.cjs
│   ├── debug-events.js
│   ├── debug.log
│   ├── debug_campground_chain.js
│   ├── debug_merch.js
│   ├── debug_org_cols.cjs
│   ├── debug_schema_standalone.js
│   ├── fix_settings.js
│   ├── host.json
│   ├── local.settings.json
│   ├── local.settings.live.json.example
│   ├── package.json
│   ├── scripts
│   │   ├── check_asset_hires.js
│   │   ├── check_constraints.js
│   │   ├── check_db.js
│   │   ├── check_linking.js
│   │   ├── check_roles.js
│   │   ├── check_tickets.js
│   │   ├── clone_db.js
│   │   ├── debug_admin_query.js
│   │   ├── debug_assets.js
│   │   ├── drop_tables.js
│   │   ├── dump_schema.js
│   │   ├── enable_crew_role.js
│   │   ├── ensure_schema_minimal.js
│   │   ├── fresh_start_2026.js
│   │   ├── get_latest_code.js
│   │   ├── init_crew_schema.js
│   │   ├── seed_demo_data.js
│   │   ├── seed_winter_tickets.js
│   │   ├── test_cascade_logic.js
│   │   ├── update_schema_merch.js
│   │   ├── verify_dev_connection.js
│   │   └── verify_link.js
│   ├── src
│   │   ├── functions
│   │   │   ├── assets
│   │   │   │   ├── getAssetAvailability.js
│   │   │   │   ├── getAssetHires.js
│   │   │   │   ├── getAssets.js
│   │   │   │   ├── manageAssetItems.js
│   │   │   │   └── manageAssetTypes.js
│   │   │   ├── authLogin.js
│   │   │   ├── authRegister.js
│   │   │   ├── authVerifyEmail.js
│   │   │   ├── createAdmin.js
│   │   │   ├── createCampground.js
│   │   │   ├── createCampsites.js
│   │   │   ├── createEvent.js
│   │   │   ├── createOrder.js
│   │   │   ├── createProduct.js
│   │   │   ├── createSubevent.js
│   │   │   ├── createVenue.js
│   │   │   ├── debugPath.js
│   │   │   ├── debugStatus.js
│   │   │   ├── debug_camp.js
│   │   │   ├── debug_schema.js
│   │   │   ├── debug_sql.js
│   │   │   ├── debug_subevents.js
│   │   │   ├── deleteAdmin.js
│   │   │   ├── deleteCampground.js
│   │   │   ├── deleteCampsite.js
│   │   │   ├── deleteEvent.js
│   │   │   ├── deleteProduct.js
│   │   │   ├── deleteProductVariant.js
│   │   │   ├── deleteSKU.js
│   │   │   ├── deleteSubevent.js
│   │   │   ├── deleteVariantOption.js
│   │   │   ├── generateSKUs.js
│   │   │   ├── getAdminDashboardStats.js
│   │   │   ├── getAdminOrders.js
│   │   │   ├── getAdmins.js
│   │   │   ├── getCampgroundAvailability.js
│   │   │   ├── getCampgrounds.js
│   │   │   ├── getCampsites.js
│   │   │   ├── getEventDetail.js
│   │   │   ├── getEvents.js
│   │   │   ├── getEventTicketTypes.js
│   │   │   ├── getOrderDetail.js
│   │   │   ├── getOrganization.js
│   │   │   ├── getProductDetails.js
│   │   │   ├── getProducts.js
│   │   │   ├── getStoreItems.js
│   │   │   ├── getSubevents.js
│   │   │   ├── getUserEventAttendees.js
│   │   │   ├── getUserOrders.js
│   │   │   ├── getUsers.js
│   │   │   ├── getVenues.js
│   │   │   ├── manageProductOptions.js
│   │   │   ├── ping.js
│   │   │   ├── setupTest.js
│   │   │   ├── temp_check.js
│   │   │   ├── testDb.js
│   │   │   ├── ticketTypes.js
│   │   │   ├── updateAdmin.js
│   │   │   ├── updateAttendee.js
│   │   │   ├── updateCampground.js
│   │   │   ├── updateCampsite.js
│   │   │   ├── updateCampsiteCoords.js
│   │   │   ├── updateEvent.js
│   │   │   ├── updateOrganizationSettings.js
│   │   │   ├── updateProduct.js
│   │   │   ├── updateSKU.js
│   │   │   ├── updateSubevent.js
│   │   │   ├── updateUserStatus.js
│   │   │   ├── update_schema_force.js
│   │   │   ├── update_schema_merch_func.js
│   │   │   └── uploadImage.js
│   │   └── lib
│   │       ├── auth.js
│   │       ├── db.js
│   │       └── emailService.js
│   ├── test_admin_conn.cjs
│   └── test_update_org.cjs
├── client
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── public
│   │   ├── aeroplane.svg
│   │   ├── campgrounds
│   │   │   └── test-map.jpg
│   │   ├── uploads
│   │   │   ├── 0254fcdf-3fb9-4f91-bcd2-6d85c5956320.jpg
│   │   │   ├── 07cf2f2d-eb1b-405a-b588-cd71b8931d39.jpg
│   │   │   ├── 07d10cdf-ffa7-430a-963e-19c6f4d9a278.avif
│   │   │   ├── 0a7b75eb-a514-4a7d-b79d-c5dfc1aba3d1.jpg
│   │   │   ├── 0ed9b61c-634b-4e0c-aaea-9a8fd28d96e0.jpg
│   │   │   ├── 1245fb50-19ed-49a6-8cb4-3f46e4ce65f0.jpg
│   │   │   ├── 259f214b-5758-41fb-8416-8f3a8821f2dd.jpeg
│   │   │   ├── 39c642ef-17c4-4062-bd0b-0f779397afc9.jpg
│   │   │   ├── 3b10019a-d642-4f75-b3fb-8cb326960c0f.jpg
│   │   │   ├── 4b063df9-e1cb-4883-a9e5-390570e87b83.jpg
│   │   │   ├── 590dd673-ed67-4947-83a5-6e37ebb0a474.avif
│   │   │   ├── 5a3fc645-4838-4fe2-8c7d-87173bfb5195.png
│   │   │   ├── 5a9dc920-fe01-4fb9-a003-9603eb1a40f1.png
│   │   │   ├── 5ad576d5-682c-4339-b0c3-fcc678477915.png
│   │   │   ├── 84899830-aa26-49ca-9994-d5815c873b02.png
│   │   │   ├── 87d6a39b-0d99-4a36-bee0-ea8b9cb2b00f.jpg
│   │   │   ├── 97358203-447e-46fe-bcfa-e9c17dffa8cc.avif
│   │   │   ├── a885bc4e-ae3c-49d5-8fda-0808b491fcbb.jpg
│   │   │   ├── a9073177-59a5-4349-94db-3e2a816553d8.jpg
│   │   │   ├── ab53fdc4-9c0b-43e1-ab7d-ebadb89b032a.avif
│   │   │   ├── abfddd9a-05b9-416f-9757-881320f220e2.png
│   │   │   ├── b11cb87a-b917-4d3a-93de-47ebf45a22af.png
│   │   │   ├── bae7ab28-1bb6-4626-be20-3782fac1abdc.jpg
│   │   │   ├── c33d1032-8774-45b5-ad7f-bb9063bf62bc.png
│   │   │   ├── c6af8054-157c-42f3-ac85-81f5d59cc2f9.jpg
│   │   │   ├── c802add4-e332-4eaf-9913-82da2ad978e0.jpg
│   │   │   ├── dcf751bb-e314-45f1-902f-d32dd4ae903a.jpg
│   │   │   ├── e13284e0-e0fa-4af3-9b74-be8fd62a1aa5.png
│   │   │   ├── e1c4f18e-ab1e-4887-a5b6-bc710fb5a5f0.png
│   │   │   ├── e4f8fc62-8343-4890-88e7-347e94272315.png
│   │   │   └── edbdae35-a282-4452-acc9-d08fea2c7ddb.jpg
│   │   └── vite.svg
│   ├── README.md
│   ├── scripts
│   │   ├── create_real_admin.cjs
│   │   ├── create_real_admin.js
│   │   └── create_test_users.js
│   ├── src
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── admin
│   │   │   │   └── SubeventForm.jsx
│   │   │   ├── AssetSelectionModal.jsx
│   │   │   ├── CampsiteModal.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductModal.jsx
│   │   │   └── ui
│   │   │       ├── ConfirmationModal.jsx
│   │   │       └── ToastContainer.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── pages
│   │       ├── admin
│   │       │   ├── AdminDashboard.jsx
│   │       │   ├── AdminOrders.jsx
│   │       │   ├── AdminSettings.jsx
│   │       │   ├── AdminSubevents.jsx
│   │       │   ├── AssetDashboard.jsx
│   │       │   ├── assets
│   │       │   │   ├── AssetHires.jsx
│   │       │   │   ├── AssetItems.jsx
│   │       │   │   └── AssetTypes.jsx
│   │       │   ├── EventForm.jsx
│   │       │   ├── MerchandiseList.jsx
│   │       │   ├── ProductEditor.jsx
│   │       │   └── settings
│   │       │       ├── AdminList.jsx
│   │       │       ├── AdminModal.jsx
│   │       │       ├── OrgSettings.jsx
│   │       │       └── UserList.jsx
│   │       ├── camping
│   │       │   ├── AdminMapTool.jsx
│   │       │   └── CampingPage.jsx
│   │       ├── Checkout.jsx
│   │       ├── EventDetails.jsx
│   │       ├── EventPurchase.jsx
│   │       ├── Events.jsx
│   │       ├── Home.jsx
│   │       ├── Login.jsx
│   │       ├── MyOrders.jsx
│   │       ├── OrderDetail.jsx
│   │       ├── Register.jsx
│   │       ├── ShopIndex.jsx
│   │       ├── StorePage.jsx
│   │       └── VerifyEmail.jsx
│   └── vite.config.js
├── docs
│   ├── AI_SESSION_BRIEF.md
│   ├── ARCHIVE
│   │   ├── AERO_Project_Context.md
│   │   ├── AERO_TRD.md
│   │   ├── Development_Log_v2.md
│   │   ├── Project_Backlog.md
│   │   ├── Registration_Flow_Recommendation_20251225.md
│   │   └── Schema_Changes_Summary.md
│   ├── azure_auth_fix.md
│   ├── DEPLOYMENT.md
│   ├── Development_Log.md
│   ├── Future_Feature_Requirements.md
│   ├── Merchandise_Implementation_Plan.md
│   ├── Pilot_Logic_Deep_Dive.md
│   ├── ROADMAP.md
│   └── SESSION_WORKFLOW.md
└── scripts
    ├── add_image_url_to_asset_items.sql
    └── generate_notebooklm_context.js
```

## Client Configuration (client/package.json)
### Scripts
- dev: vite
- build: vite build
- lint: eslint .
- preview: vite preview

### Dependencies
Dependencies:
- lucide-react: ^0.562.0
- react: ^19.2.0
- react-dom: ^19.2.0
- react-qr-code: ^2.0.18
- react-router-dom: ^7.11.0
Dev Dependencies:
- @eslint/js: ^9.39.1
- @tailwindcss/vite: ^4.1.18
- @types/react: ^19.2.5
- @types/react-dom: ^19.2.3
- @vitejs/plugin-react: ^5.1.1
- autoprefixer: ^10.4.23
- eslint: ^9.39.1
- eslint-plugin-react-hooks: ^7.0.1
- eslint-plugin-react-refresh: ^0.4.24
- globals: ^16.5.0
- postcss: ^8.5.6
- tailwindcss: ^4.1.18
- vite: ^7.2.4


## API Configuration (api/package.json)
### Scripts
- start: func start
- test: echo "No tests yet..."

### Dependencies
Dependencies:
- @azure/functions: ^4.0.0
- @azure/storage-blob: ^12.29.1
- bcryptjs: ^3.0.3
- jsonwebtoken: ^9.0.3
- mssql: ^12.2.0
- resend: ^6.7.0
Dev Dependencies:
- azure-functions-core-tools: ^4.x


Connected to SQL Server
# Database Schema


## Documentation: AI_SESSION_BRIEF.md

# AI Session Brief & Context

**Role:** You are an AI Full-Stack Engineer pairing with Josh (User).
**Objective:** Build high-quality, "wow-factor" web applications with clean architecture and robust features.

## 📝 Session Startup Checklist

> **Full Procedures**: See [SESSION_WORKFLOW.md](SESSION_WORKFLOW.md) for detailed Start, Execution, and End-of-Session protocols.

1.  **Read this file** (`docs/AI_SESSION_BRIEF.md`) to ground yourself.
2.  **Follow the Workflow**: Execute the "Start of Session" steps in `docs/SESSION_WORKFLOW.md`.
3.  **Check Environment**: Refer to `docs/DEPLOYMENT.md` to ensure you are on the correct DB (Dev vs Live).


## 🔭 Project Vision & Roles
*   **Whitelabel Goal:** Initially built for *Australian Large Scale Models* (Dave), but intended for resale to other groups.
    *   **Branding:** Must be versatile. Styles are driven by `organization_settings` (primary/secondary/accent/logo) to allow full rebranding.
*   **Key User Roles:**
    1.  **Admin:** Data maintenance, configuration, reporting.
    2.  **User (Public):** Event registration, ticket purchase, campsite booking, item hire.
    3.  **Site Crew:** Operational tasks (Gate check-in, campsite direction, merchandise distribution).

## 👤 User Preferences (Josh)
*   **Level:** Beginner. **Explain concepts as we go.** Do not assume knowledge. Ask before acting if unsure.
*   **Aesthetics:** Premium, "wow-factor" designs. Responsive and polished.
*   **Workflow:**
    *   **Pairing:** I will be the driver. You will be the navigator.
    *   **Planning:** Always plan before coding.
    *   **Step-by-Step:** collaborative iteration.
    *   **Files:** Keep `docs/` clean.
    *   **Session Wrap-up:**
        *   Log work in `docs/Development_Log.md`
        *   Update `docs/ROADMAP.md` (move completed items to "Completed", add new items to "Next Up")  
        *   **Export Schema:** Remind user to update `docs/schema.sql` (In SSMS: Select **ANSI text** to ensure readability).
        *   Remind user to commit to Git - include a meaningful message.
*   **Testing:** Testing is critical. **I need to physically see the results of each step** to ensure it is working correctly before moving on.

## 🏗️ Project Architecture
*   **Frontend:** React (Vite)
*   **Backend:** Azure Functions (Node.js)
*   **Database:** Azure SQL Database
*   **Live Environment:** [AERO Project Live](https://lively-sea-07f844a00.1.azurestaticapps.net/)
    *   *Note: Uses X-Auth-Token header to bypass Azure EasyAuth interference.*
*   **Key Patterns:**
    *   **Auth:** JWT-based.
    *   **DB Access:** Singleton Connection Pool.
    *   **Styling:** CSS variables via `organization_settings`.

## 🔄 Core Development Rules
1.  **Strict Schema Compliance:** Always check `docs/schema.sql` (or active DB state) before writing queries.
2.  **Transactions:** Use SQL Transactions for multi-table writes.
3.  **Mobile First:** UIs must be optimized for phone usage.

## 🧠 Complex Data Flows
*   **Registration Entity Chain:** `User` -> `Person` -> `Attendee` -> `OrderItem`.
    *   **User vs Person:** `Users` link to Auth. `Persons` hold profile data. A User *has* a Person record. Guests are Persons with no User link.
    *   **Attendee:** Links a `Person` to an `Event`. (Must exist *before* OrderItem).
    *   **Order Item:** Links the purchase to the `Attendee`.
*   **Pilot/Planes:**
    *   Planes are owned by a `Person`.
    *   During registration, planes are linked to the *Attendee's Person ID*.
    *   Planes are also linked to the event via `event_planes`.
*   **Pit Crew:**
    *   Crew are linked to Pilots via `pilot_pit_crews` (Join table: `pilot_attendee_id` <-> `crew_attendee_id`).


---

## Documentation: azure_auth_fix.md

Critical: Azure Authentication & Header Overwriting
The Issue
When hosting on Azure App Service or Static Web Apps, if "Authentication" (EasyAuth) is enabled or interacting with the service, Azure intercepts and overwrites the standard Authorization header.

Client Sends: Authorization: Bearer <Your-App-JWT>
Azure Receives: Authorization: Bearer <Azure-Management-Token>
This mismatch causes signature verification to fail because the backend tries to verify Microsoft's token (signed with their keys) using your application's JWT_SECRET.

Symptoms
JWT Verify Failed: invalid signature despite correct JWT_SECRET.
Decoded token has iss: ...scm.azurewebsites.net (Azure) instead of your app's issuer.
Public routes work; protected routes return 401/403.
The Fix: X-Auth-Token Bypass
To ensure the backend receives the correct application token, pass it in a custom header that Azure ignores.

1. Frontend Update
In your 
fetch
 calls (e.g., 
AdminDashboard.jsx
, 
AdminOrders.jsx
), send the token in X-Auth-Token as well:

headers: {
    'Authorization': `Bearer ${token}`, // Still send this for standard compliance/local dev
    'X-Auth-Token': token               // The critical bypass header
}
2. Backend Update (
lib/auth.js
)
Update the token extraction logic to prioritize the custom header:

function validateToken(request) {
    const SECRET_KEY = process.env.JWT_SECRET;
    
    // Check custom header first to bypass Azure overwrites
    const customHeader = request.headers.get('x-auth-token');
    const authHeader = request.headers.get('Authorization');
    
    let token = null;
    if (customHeader) {
        token = customHeader;
    } else if (authHeader) {
        token = authHeader.split(' ')[1];
    }
    
    if (!token) return null;
    
    // ... verify logic ...
}
Troubleshooting
If auth fails again, use 
api/src/functions/debugStatus.js
 (if deployed) to inspect the incoming headers and token claims. Look specifically at the iss (Issuer) field of the received token.



---

## Documentation: DEPLOYMENT.md

# Deployment & Environment Guide

This document explains how the application handles different environments (Local/Dev vs. Live/Prod) and how to deploy updates.

## Environments

### 1. Local Development (Dev)
*   **Frontend**: Runs on `localhost:5173`.
*   **Backend**: Runs on `localhost:7071` (Azure Functions Core Tools).
*   **Database**: `sqldb-aero-dev` (Hosted on Azure SQL).
*   **Configuration**:
    *   Managed by `api/local.settings.json`.
    *   **Note**: This file is `.gitignore`'d and should NOT be committed.
    *   **Connection String**: `SQL_CONNECTION_STRING` points to `sqldb-aero-dev`.

### 2. Live Production (Live)
*   **Frontend**: Azure Static Web App (`lively-sea-...`).
*   **Backend**: Azure Functions (Production Slot).
*   **Database**: `sqldb-aero-master` (Hosted on Azure SQL).
*   **Configuration**:
    *   Managed via **Azure Portal** -> App Service -> Settings -> **Environment Variables**.
    *   **Connection String**: `SQL_CONNECTION_STRING` points to `sqldb-aero-master`.

## Environment Switching
We do **not** change code to switch environments. We change the *configuration*.
*   **To verify Local is Dev**: Check `api/local.settings.json`.
*   **To maintain Live is Live**: Never overwrite Azure App Settings with local settings during deployment.

## Deployment Workflow

The project is connected to GitHub.

1.  **Frontend & Backend**:
    *   Pushing to the `main` branch on GitHub automatically triggers the Azure Deployment Action.
    *   This builds the React app and deploys the Function App code.
    *   It **does not** touch the database or the connection strings defined in Azure.

## Database Management
*   **Schema Changes**: Must be applied to *both* `sqldb-aero-dev` (during dev) and `sqldb-aero-master` (during deployment).
*   **Data**: Data is **not** automatically synced.
    *   **Refresh Dev**: To make Dev look like Live, run the `clone_db.js` script (or manual Copy in Azure).


---

## Documentation: Development_Log.md

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



---

## Documentation: Future_Feature_Requirements.md

# Future Feature Requirements: Core Modules

This document outlines the roadmap for the remaining "Product" modules.

## 1. Event Registration (Continued)
*   **Ticket Logic:** Continues to use the core `cart` and `createOrder` flow.
*   **Pilot/Plane Logic:** Moved to dedicated document: [Pilot Logic Deep Dive](Pilot_Logic_Deep_Dive.md).
    *   Includes: "My Hangar", Multiple Planes, and Flight Line Duties.

## 2. Campsite Booking
**Tables:** `campgrounds`, `campsites`, `campsite_bookings`

*   **Concept:** Users book a physical space for accommodation.
*   **Selection Mode:**
    *   **Map Based (Preferred):** Interactive map where users click a specific site (e.g., "Site A1").
    *   **List Fallback:** If no map image/coordinates provided by Admin, show a simple list of available site names.
*   **Occupancy:**
    *   **Multiple Attendees:** A single campsite booking can be linked to multiple Attendees (e.g., a family of 4 sharing "Site B2").
    *   **No Role Restrictions:** Any ticket holder can camp (unless specifically restricted by Admin, but generally open).

## 3. Subevent Registration
**Examples:** Qualification Workshops, Gala Dinners, Safety Briefings.

*   **Concept:** Add-on tickets/registrations for specific scheduled activities.
*   **Key Logic:**
    *   **Attendee Linking:** Must link to a specific *Attendee* (Person).
    *   **Capacity:** Strict limits (e.g., "Dinner Hall holds 200").
    *   **Time Conflict Checks:**
        *   **Subevent vs Subevent:** Cannot be in two places at once.
        *   **Subevent vs Duties:** Cannot attend Dinner if rostered for Flight Line Duty (see Pilot Doc).

## 4. Merchandise Store
**Tables:** `products`, `product_skus`, `variant_categories`, `variant_options`, `sku_option_links`

*   **Concept:** E-commerce flow for physical goods.
*   **Variant Logic:**
    *   Products have Options (Size, Color).
    *   SKUs represent the specific combination (e.g., "T-Shirt - Large - Red").
    *   Inventory is tracked at the SKU level.
*   **Fulfillment:**
    *   **Pickup Only:** No shipping logic required. Users collect at the event "Merch Tent".

## 5. Asset Hire
**Tables:** `asset_hires`, `asset_items`, `asset_types`

*   **Concept:** Hiring operational equipment (Tables, Chairs, Weights, Cables).
*   **Logic:**
    *   **Stock Tracking:** Pool of items (e.g., "50 Chairs available").
    *   **Deposits:** Handling refundable security bonds.
    *   **Check-in/Out:** Operational flow for handing out items and marking them returned.

---

## 6. Operational Logic (Gate & Compliance)

### 6.1 Waivers
*   **Trigger:** Checkout success or First Login after purchase.
*   **Storage:** Digital signature blob or boolean `is_signed` + timestamp/ip.
*   **Gate Enforce:** "Cannot check in if Waiver not signed".

### 6.2 Gate Check-in
*   **QR Codes:** Unique per attendee (Ticket Code).
*   **Action:** Mobile-first scanner app updates `attendees.status` to 'Checked In'.


---

## Documentation: Merchandise_Implementation_Plan.md

# Merchandise Implementation Plan

## Goal Description
Enable a comprehensive system for selling merchandise for events. This includes a full Admin workflow for managing products, variants (e.g., Size, Color), and event-specific pricing, as well as the User workflow for browsing and purchasing items.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: `order_items`.`attendee_id` must be made **NULLable** to support merchandise items that are not linked to a specific attendee ticket.

## Proposed Changes

### Database Schema
#### [MODIFY] Database Schema
-   **`order_items`**: Change `attendee_id` to `[int] NULL`.
- Instruct user how to make this change

### Admin Workflow (Backend & Frontend)
1.  **Product Management**
    -   **API**:
        -   `POST /api/admin/products`: Create generic product (Name, Description, Base Image).
        -   `PUT /api/admin/products/{id}`: Update details.
        -   *Note: Images to be uploaded via existing `uploadImage` utility and URL stored.*
    -   **Frontend**: Admin > Global Settings > Products (New Section).

2.  **Variant Management**
    -   **API**:
        -   `POST /api/admin/products/{id}/variants`: Define categories (e.g., "Size") and options (e.g., "S", "M", "L").
        -   Support attaching images to specific variant options (e.g., "Blue" shirt image).
    -   **Frontend**: Interface to add Variant Categories and Options to a Product.

3.  **SKU Generation**
    -   **API**:
        -   `POST /api/admin/products/{id}/skus/generate`: Auto-generate SKUs for all variant combinations.
        -   `GET /api/admin/products/{id}/skus`: List generated SKUs.
    -   **Frontend**: Table showing all combinations. Allow manual override of SKU codes/Barcodes.

4.  **Event Pricing (Merchandise Assignment)**
    -   **API**:
        -   `POST /api/admin/events/{eventId}/merchandise`: Link Product SKUs to an Event and set the **Price**.
        -   Inserts into `event_skus` table.
    -   **Frontend**: Admin > Event > Merchandise Tab. Select Products, toggle specific SKUs, set Price.

### User Workflow (Frontend & Backend)
1.  **Browse Merchandise**
    -   **API**: `GET /api/events/{id}/merchandise` (Returns products with consolidated Price range and Options).
    -   **Frontend**: User Booking Flow > "Add Extras" step (or separate Merchandise tab).
    -   *UI*: Product Cards -> Click to view Details -> Select Options (Color/Size) -> Update Image based on selection -> Add to Cart.

2.  **Purchase (Checkout)**
    -   **API**: `createOrder` (Updated).
        -   Accept `merchandise` items in payload.
        -   Validate stock (if tracked) and active status.
        -   Create `order_items` with `item_type='Merchandise'` and `attendee_id=NULL`.
    -   **Frontend**: Cart Summary lists merch items separately from Tickets/Camping.

## Implementation Steps
1.  **Schema Update**: Apply `ALTER TABLE` for `order_items`.
2.  **Admin API**: Build Product/Variant/SKU endpoints.
3.  **Admin UI**: Build Product Manager & Event Linker.
4.  **User API**: `getEventMerchandise` & update `createOrder`.
5.  **User UI**: Merchandise Storefront & Cart update.

## Verification Plan
### Automated Tests
-   **Admin Flow**: Create Product -> Add Variants -> Generate SKUs -> Link to Event.
-   **User Flow**: Fetch Event Merch -> Add to Cart -> Checkout -> Verify Order Item created with NULL attendee.

### Manual Verification
-   **images**: Upload base product image and variant-specific images (e.g., Blue shirt). Verify switching options in User UI changes the displayed image.


---

## Documentation: Pilot_Logic_Deep_Dive.md

# Deep Dive: Pilot & Plane Logic

This document details the complex logic required for Pilot and Aircraft management, separating it from the core module requirements.

## 1. Registration Flow Enhancements
**Scenario:** "I am registering a Pilot (Myself or another person I manage)."

### 1.1 Pilot Lookup (The "Person" Layer)
*   **User Action:** Selects "Myself" OR "Existing Pilot" (from `persons` linked to their User ID).
    *   *Note:* A single User Account (e.g., Dad) might manage multiple Pilots (Self + Son).
*   **System Action:**
    *   Pre-fills Name, ARN, License info from the selected `persons` record.
    *   If "New Pilot", requires full entry and creates a new `persons` record linked to the User.

### 1.2 Plane Selection (The "Hangar")
Real-world pilots often bring multiple planes or fly different planes at different events. They should not re-enter data every time.

*   **UI:** "Select Aircraft" section appears after Pilot selection.
*   **Option A: "My Hangar"**
    *   Lists planes already in the `planes` table linked to this Person.
    *   *UI:* Checkbox selection (e.g., `[x] Extra 300 (VH-X30)`, `[ ] Cessna 172 (VH-C17)`).
*   **Option B: "New Aircraft"**
    *   *UI:* "Add another plane" button.
    *   *Inputs:* Make, Model, Rego.
    *   *Action:* Creates a new `planes` record linked to the Person immediately (or upon Order creation).

### 1.3 Persistence (The "Event Link")
*   **Database:** We do not duplicates planes per event.
*   **`event_planes` Table (Proposed):**
    *   Many-to-Many link acting as the "Attendance Record" for the aircraft.
    *   Columns: `event_plane_id`, `event_id`, `plane_id`, `pilot_attendee_id`.
*   **Validation:** Check `event_ticket_types` for any limits on number of planes (likely "Unlimited" for most pilot tickets).

---

## 2. Flight Line Duties
Volunteering for duties is critical for event operations.

### 2.1 Registration & Availability
*   **Trigger:** During Pilot Registration.
*   **Input:** Checkbox `[x] Available for Flight Line Duties`.
*   **Storage:** Stored on the `attendees` record (new column `is_volunteer` or similar).

### 2.2 Ops Dashboard (Admin)
*   **Interface:** A "Roster" view of 1-hour slots for the event duration.
*   **Action:** Admin drags-and-drops available pilots into slots.
*   **Validation:**
    *   **Time Conflict:** Ensure the pilot is not registered for a Subevent (Dinner/Workshop) during that slot.


---

## Documentation: ROADMAP.md

# 🗺️ Project Roadmap & Agile Board

## 🚀 Current Sprint (Active)
**Goal:** Registration Flow & Attendee Management

- [x] **Data Model Updates** <!-- via Registration_Flow_Recommendation.md -->
    - [x] SQL: Make `persons.user_id` nullable.
    - [x] SQL: Add `is_pilot` to `event_ticket_types`.
    - [x] SQL: Add `is_pit_crew` and `ticket_code`.
- [x] **Registration Logic (API)**
    - [x] Upgrade `createOrder.js` to handle Pilot (Planes) & Crew (Linking).
    - [x] Refactor `createOrder.js` for In-Cart Linking (Temp IDs).
    - [x] Update `getEventDetail` to expose `is_pilot` and `is_pit_crew`.
    - [x] Create `getUserEventAttendees` for previous pilot lookup.
- [x] **Registration UI (Frontend)**
    - [x] Enhance `AttendeeModal` with dynamic forms (Pilot vs Crew vs Spectator).
    - [x] Implement "Smart Pilot Selector" (In-Cart + Previous + Manual).
    - [x] Implement Validations.

## 📋 Next Up (Ready for Dev)
- [x] **QR Code Generation:** Display unique QR code for each ticket (for gate scanning).
- [x] **Campsite Booking:** Interactive map/list for booking camping spots (Backend & Admin Tool Complete).
- [ ] **Merchandise Store:** E-commerce flow for pre-purchasing gear.

## 📦 Backlog (Future)
### Authentication & User Management
- [ ] **Email Confirmation:** Verify via SendGrid.
- [ ] **Social Login:** Google/Microsoft OAuth.
- [ ] **Role Management:** Admin UI.
- [ ] **Waiver System:** Digital waiver signing (Deferred).

### Operational Features
- [ ] **Mobile Scanning App:** Gate entry.

### Technical Debt / Polish
- [ ] **Refacto createOrder.js:** Split into `OrderService.js`.
- [ ] **Toast Notifications:** Replace alerts with toast library.
- [ ] **Loading Skeletons:** Better empty states.
- [ ] **Schema:** Add semantic keys for colors (`success_color`).

## 🏁 Completed (Recent)
- [x] **Public Events Module:** List and Detail views.
- [x] **Ticket Purchasing MVP:** Basic flow with mock payment.
- [x] **Authentication:** Login/Register.


---

## Documentation: SESSION_WORKFLOW.md

# Session Workflow

This guide outlines the standard operating procedure for starting, conducting, and ending a development session. Adhering to this workflow ensures context is preserved and the codebase remains stable.

## 1. Start of Session (Context Loading)

Before writing any code, you must "load" the project context into your working memory.

1.  **Read the Master Index**: `docs/AI_SESSION_BRIEF.md`.
2.  **Check the Roadmap**: `docs/ROADMAP.md` to see high-level goals.
3.  **Read Recent History**: Check the latest entry in `docs/Development_Log.md` to understand where the last session ended.
4.  **Check Environment**:
    *   Ensure `api/local.settings.json` is configured correctly (usually pointing to `sqldb-aero-dev`).
    *   Start the Client: `cd client && npm run dev`.
    *   Start the API: `cd api && npm start`.
    *   **Verify**: Open `http://localhost:5173` and click around to ensure connectivity.

## 2. During Session (Development)

1.  **Plan First**: Always create an `implementation_plan.md` artifact for complex tasks. Get user approval.
2.  **Atomic Steps**: Break work into small, verifiable chunks.
3.  **Visual Verification**: The user (Josh) needs to *see* results. Use `notify_user` to ask for verification after UI changes.
4.  **Logging**: Keep a running mental note (or scratchpad) of what you've changed.
5.  **Database Changes**:
    *   **NEVER** modify the database schema without checking `Active DB State` first.
    *   Prefer **Transactions** for multi-table writes.

## 3. End of Session (Handover)

1.  **Documentation**:
    *   Append a new entry to `docs/Development_Log.md` summarizing the session.
    *   Use the format: `## [YYYY-MM-DD] - Title`.
    *   List **Completed Items** and **Next Steps**.
2.  **Roadmap Update**: Update `docs/ROADMAP.md` (Check off items, move next steps up).
3.  **Cleanup**:
    *   Delete temporary scripts or files created during the session.
4.  **Commit**:
    *   Remind the user to commit changes to Git.
    *   Provide a suggested commit message based on the work done.


---

## API Functions List
- authLogin.js
- authRegister.js
- authVerifyEmail.js
- createAdmin.js
- createCampground.js
- createCampsites.js
- createEvent.js
- createOrder.js
- createProduct.js
- createSubevent.js
- createVenue.js
- debugPath.js
- debugStatus.js
- debug_camp.js
- debug_schema.js
- debug_sql.js
- debug_subevents.js
- deleteAdmin.js
- deleteCampground.js
- deleteCampsite.js
- deleteEvent.js
- deleteProduct.js
- deleteProductVariant.js
- deleteSKU.js
- deleteSubevent.js
- deleteVariantOption.js
- generateSKUs.js
- getAdminDashboardStats.js
- getAdminOrders.js
- getAdmins.js
- getCampgroundAvailability.js
- getCampgrounds.js
- getCampsites.js
- getEventDetail.js
- getEvents.js
- getEventTicketTypes.js
- getOrderDetail.js
- getOrganization.js
- getProductDetails.js
- getProducts.js
- getStoreItems.js
- getSubevents.js
- getUserEventAttendees.js
- getUserOrders.js
- getUsers.js
- getVenues.js
- manageProductOptions.js
- ping.js
- setupTest.js
- temp_check.js
- testDb.js
- ticketTypes.js
- updateAdmin.js
- updateAttendee.js
- updateCampground.js
- updateCampsite.js
- updateCampsiteCoords.js
- updateEvent.js
- updateOrganizationSettings.js
- updateProduct.js
- updateSKU.js
- updateSubevent.js
- updateUserStatus.js
- update_schema_force.js
- update_schema_merch_func.js
- uploadImage.js

