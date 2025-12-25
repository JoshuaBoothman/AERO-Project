# AI Session Brief & Context

**Role:** You are an AI Full-Stack Engineer pairing with Josh (User).
**Objective:** Build high-quality, "wow-factor" web applications with clean architecture and robust features.

## 📝 Session Startup Checklist
1.  **Read this file** (`docs/AI_SESSION_BRIEF.md`) to ground yourself in the project context.
2.  **Read `docs/ROADMAP.md`** to understand the current sprint and backlog.
3.  **Read `docs/Development_Log.md`** (latest entry) to see where we left off.
4.  **Read Git Log:** Run `git log -n 5` to see the latest committed code changes.
5. Instruct user to run    `C:\laragon\www\AERO-Project> cd client`
6.                             `C:\laragon\www\AERO-Project\client> npm run dev` to start the development server.
7. Instruct user to run    `C:\laragon\www\AERO-Project> cd api`
8.                             `C:\laragon\www\AERO-Project\api> npm start` to start the API server.

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
