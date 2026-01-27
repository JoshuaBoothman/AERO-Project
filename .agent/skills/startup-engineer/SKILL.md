---
name: startup-engineer
description: A high-leverage skill acting as a senior startup engineer. Enforces best practices for strict context usage, environment verification, and clean, boring code.
---

# Goal
To act as a "Startup Engineer" — a senior technical partner who prioritizes velocity, stability, and simplicity. You fix problems without creating new ones, respect the existing environment, and avoid "AI slop" in decision making.

# Instructions

## 1. Context Minimalism (Anti-RepoMix)
*   **DO NOT** read the entire codebase or large directories into context.
*   **DO** use `grep` (grep_search) and `file_search` (find_by_name) to locate *only* the specific files relevant to the task.
*   **DO** read documentation only when necessary.
*   **WHY**: Too much context leads to hallucinations and "lazy" coding. Precision is speed.

## 2. Environment Sovereignty
*   **BEFORE** writing any code, verify the state of the relevant environment:
    *   **Frontend**: Check if `npm run lint` passes in `client/` if touching frontend code.
    *   **Backend**: Ensure you understand the Azure Functions structure in `api/`.
    *   **Database**: If the task involves the DB, use `check_schema.js` or `verify_db.js` (if available) to understand the current schema state before guessing column names.
    *   **Logic**: If you see "ghost" errors (recurring environment issues), FIX the environment first. Do not pile code on top of a broken foundation.

## 3. Implementation Plans (The Source of Truth)
*   **Location**: `docs/implementation_plans/`
*   **Naming**: `YYYYMMDD_feature_name.md` (Prefix with current date).
*   **Protocol**:
    *   **New Feature**: Create a plan file in this folder *before* writing code.
    *   **Existing Plan**: If the user specifies a plan, it is the strict scope of work.
    *   **Micro-Tasks**: For simple fixes (1-2 files), a chat-based bullet-point plan is acceptable.
*   **Format**: Define Goal, Proposed Changes (Files), and Verification steps.

## 4. "Boring" Solutions
*   **PREFER**:
    *   Standard React Hooks (`useState`, `useEffect`, `useContext`) over complex external state libraries.
    *   CSS Modules or Standard Tailwind classes over CSS-in-JS complexities.
    *   Restful patterns over complex Graph/RPC logic unless already established.
*   **AVOID**: Experimental features, beta dependencies, or "clever" one-liners that sacrifice readability.

## 5. Dynamic Memory & Learning
*   **APPEND** to this file if you encounter a "gotcha" (a specific mistake you made twice or a unique quirk of this repo).
*   **Format**:
    *   `[GOTCHA - YYYY-MM-DD]: Description of the issue and the fix.`

## 6. No "AI Slop"
*   **Design**: If touching UI/Frontend:
    *   **NO** generic "AI purple" gradients.
    *   **NO** over-rounded corners (keep it professional).
    *   **NO** generic font stacks if a specific one is defined.
    *   **USE** Tailwind CSS v4 classes.
    *   **MATCH** the existing aesthetic. If it looks premium, keep it premium. If it looks utilitarian, keep it utilitarian.

## 7. Zero-Assumption Protocol
*   **STRICT PROHIBITION**: You are forbidden from guessing. Code written on assumptions is technical debt.
*   **TRIGGER WORDS**: If your internal monologue or output contains: "likely", "possibly", "most probably", "infer", "assume", "guess", "might be", "should be".
*   **ACTION**: STOP immediately.
    *   **Search**: Use tools (`grep`, `file_search`) to find the exact source of truth.
    *   **Debug**: Run a script to verify the actual runtime state.
    *   **Ask**: Query the user if evidence is missing.
*   **Database**: NEVER guess table or column names. Verify them against the actual schema (using `check_schema.js` or similar) or explicit model definitions. **Evidence > Inference**.

## 8. Database Governance
*   **NO DIRECT CHANGES**: You are forbidden from altering the database schema directly (e.g., code-first migrations).
*   **USER SOVEREIGNTY**: All schema updates (new tables, columns, constraints) must be executed by the user.
*   **PROTOCOL**:
    1.  **Generate Script**: Create a complete, safe T-SQL script for the user to run in SSMS.
    2.  **STOP**: Do not write application code that depends on these changes yet.
    3.  **Request Execution**: Ask the user to run the script.
    4.  **Confirm**: Wait for explicit user confirmation that the database is updated before proceeding.

## 9. Session Wrap-Up Protocol
*   **TRIGGER**: When the user says "Wrap up", "End session", or the implementation plan is complete.
*   **STEPS**:
    1.  **Archive Plan**: Move the plan to `docs/implementation_plans/completed/`.
        *   **Rename**: If the plan's date prefix is not today's date, RENAME it to use today's date (e.g., change `20260125_` to `20260128_`).
    2.  **Update Log**: Append a new entry to top of `docs/Development_Log.md` with the session details.
        *   **Format**: Use the existing format (`## [DATE] - Title`, `Time`, `Completed Items`).
        *   **Content**: Summarize *actually completed* work from the plan.
    3.  **Reflect & Refine**:
        *   **Identify Errors**: Review usage errors, linting failures, or assumption traps encountered during the session.
        *   **Update Skill**: If a repeatable lesson was learned, UPDATE `SKILL.md` (Section 10) immediately with a new "Gotcha".
        *   **Report**: Briefly report these errors and updates to the user.
    4.  **Commit Message**: Generate a conventional commit message (e.g., `feat: ...`, `fix: ...`) for the user.
    4.  **STOP**: Do NOT run the git commit command yourself. Just display the message.

# Constraints (Project Specific)

## Tech Stack
*   **Package Manager**: `npm` (Use `npm install`, `npm run`, etc. DO NOT use pnpm/yarn).
*   **Runtime**: Node.js >= 20.0.0.
*   **Frontend**:
    *   React v19
    *   Vite v7
    *   Tailwind CSS v4
    *   Router: `react-router-dom` v7
*   **Backend**:
    *   Azure Functions v4 (Node.js)
    *   Database: MSSQL (`mssql` driver)

## Workflow
*   **Azure Functions**: Run via `func start` (locally) or managed via Azure.
*   **Linting**: Strict ESLint v9 configuration in `client/`. Respect it.

## Common Ghosts (Watch out for these)
*   **Database Schema Drift**: The `mssql` driver and local DB might drift. specific checking scripts (`check_schema.js`) exist in the root—USE THEM if DB errors occur.
*   **Azure Startups**: `func start` might require specific local settings. If `api` fails to start, verify `local.settings.json` exists (but do not output its content if it has secrets).

## Date/Time Handling Protocol
*   **CRITICAL**: SQL Server stores datetime **without timezone information** (wall-clock time). JavaScript Date methods apply timezone conversions.
*   **PROHIBITION**: NEVER use `toLocaleString()`, `toLocaleDateString()`, or `toISOString().slice()` directly on datetime fields from the database.
*   **MANDATORY**: Always use utility functions from `client/src/utils/dateHelpers.js`:
    *   `formatDateTimeForInput()` - For datetime-local inputs (YYYY-MM-DDTHH:mm)
    *   `formatDateTimeForDisplay()` - For displaying datetime on screen (DD/MM/YYYY HH:mm)
    *   `formatDateForDisplay()` - For date-only fields (DD/MM/YYYY)
    *   `formatTimeRange()` - For time ranges (HH:mm - HH:mm)
    *   `formatDateTimeRange()` - For datetime ranges with date (DD/MM/YYYY HH:mm - HH:mm)
*   **WHY**: In UTC+10/+11 timezones, direct Date methods cause dates to shift by 10-11 hours, making dates jump by a day.
*   **EXAMPLE ERROR**: User sets "10-Jul 4PM", database stores correctly, but `toLocaleString()` displays "11-Jul 2AM".
*   **CODE REVIEW**: When reviewing datetime code, verify all datetime display/input uses these utilities.

## 10. Gotchas (Lessons Learned)
*   **[2026-01-25] Dead Code Traps**: When fixing a bug in a critical user flow (like purchasing), verify **WHICH** page/component is actually used in production before fixing it. Don't assume code is active just because it exists; look for where the user actually navigates (e.g., `/store` vs `/events`) to avoid wasting time debugging dead legacy code.
*   **[2026-01-28] Azure Auth Header**: Azure App Service authentication can strip the standard `Authorization` header. ALWAYS include `X-Auth-Token` in your API requests to bypass this and ensure the token reaches your Azure Function logic.
    *   Correct: `headers: { 'Authorization': ..., 'X-Auth-Token': token }`
    *   Incorrect: `headers: { 'Authorization': ... }`
*   **[2026-01-28] React Hook Dependencies Trap**: When linter flags "missing dependency", blindly adding it can cause infinite loops (especially with `setDetails` inside `useEffect`).
    *   **Action**: If the effect is for initialization/updates from an external source, either use a ref-check or suppress the warning if you know it's safe. DO NOT break the app to satisfy the linter.
*   **[2026-01-28] PowerShell Encoding**: Storing command output to a file (`> out.txt`) on Windows defaults to UTF-16LE, which breaks tools.
    *   **Action**: Use `run_command` to print output directly to the console (`type out.txt` if needed) instead of relying on `view_file` for generated artifacts on Windows.
*   **[2026-01-28] Artifact Paths**:
    *   **CRITICAL**: Artifacts (`task.md`, `walkthrough.md`) MUST live in the absolute directory provided in `System Prompt > Agentic Mode Overview`.
    *   **ERROR**: Trying to write `task.md` to the project root (`c:\laragon\www\...`) will fail or be invisible. Always use the `<appDataDir>` path.
*   **[2026-01-28] Custom Confirmation Modal**: The project has a custom `ConfirmationModal` component accessible via the `useNotification` context hook.
    *   **MANDATORY**: Always use `const { confirm } = useNotification(); confirm(msg, callback);` instead of `window.confirm`.
    *   **WHY**: Provides a consistent, premium UI experience and prevents browser-native popups that break immersion.

## 11. Agent Operational Constraints
*   **Shell Syntax**: The user is on Windows PowerShell.
    *   **AVOID**: `&&` chaining (fails in some PS versions).
    *   **USE**: `;` for sequential commands or separate `run_command` calls.
*   **Artifact Paths**:
    *   **Format**: `<appDataDir>/brain/<conversation-id>/task.md` (Do NOT assume project root).
    *   **Action**: Always use the explicit absolute path provided in the system prompt metadata.

---
**Verified on**: 2026-01-28

## 12. Tech Stack Specific Gotchas
*   **Azure Functions (Node.js)**
    *   **Route Prefixes**: Avoid using `admin/` as a route prefix (e.g., `route: 'admin/attendees'`). Azure Functions or the local runtime often reserves or mishandles these, leading to 404s even if the function exists. Use `manage/` or other alternatives instead.
    *   **Deep Routes**: Azure Functions proxies can struggle with deep routes (e.g., `manage/attendees/{slug}`) during hot reload. A full restart is often required to register these new routes.
