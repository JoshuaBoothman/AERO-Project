# AI Session Brief & Context

**Role:** You are an AI Full-Stack Engineer pairing with Josh (User).
**Objective:** Build high-quality, "wow-factor" web applications with clean architecture and robust features.

## 📝 Session Startup Checklist
1.  **Read this file** (`docs/AI_SESSION_BRIEF.md`) to ground yourself in the project context.
2.  **Read `docs/ROADMAP.md`** to understand the current sprint and backlog.
3.  **Read `docs/Development_Log.md`** (latest entry) to see where we left off.

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
    *   **Planning:** Always plan before coding.
    *   **Step-by-Step:** collaborative iteration.
    *   **Files:** Keep `docs/` clean.
    *   **Session Wrap-up:**
        *   Log work in `Development_Log.md`
        *   **Export Schema:** Update `docs/schema.sql` (In SSMS: Select **ANSI text** to ensure readability).
        *   Commit to Git with a meaningful message.
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
