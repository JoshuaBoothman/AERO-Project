# Context Grounding Protocol

## Goal
To eliminate errors caused by assumptions about database schema, API signatures, and project dependencies by enforcing strict context gathering before action.

## 1. Session Start Protocol (Grounding)
At the beginning of EVERY session, the following actions must be taken to "boot up" context:

### A. Tech Stack Verification
*   **Action**: Read `package.json` (root/api/client) to confirm dependencies.
*   **Verify**: 
    - Database Driver (e.g., `mssql` vs `mysql` vs `pg`).
    - Framework versions (e.g., Azure Functions v4, React 18).
    - Styling libraries (e.g., Tailwind v4).

### B. Recent History
*   **Action**: Read the last 50 lines of `docs/Development_Log.md`.
*   **Verify**:
    - What was just completed?
    - Are there any architectural changes noted?

### C. Database Schema Refresh
*   **Action**: Read `docs/database_schema.md` (or equivalent governance doc).
*   **Verify**:
    - Table names (e.g., `admin_users` vs `users`).
    - Column names (e.g., `is_admin` vs `role`).
*   **If uncertain**: Run a schema query (`SELECT TOP 1 * FROM [TableName]`) before assuming column existence.

---

## 2. Pre-Implementation Protocol (Look Before You Leap)
Before writing or modifying any code, the following checks are mandatory:

### A. Dependency Verification
*   **Rule**: Never import a function without verifying its export.
*   **Action**: If importing `getPermissions` from `auth.js`, FIRST `view_file api/src/lib/auth.js` to confirm `getPermissions` is exported.

### B. Schema Verification
*   **Rule**: Never write SQL without verifying the table structure.
*   **Action**: 
    - Check `docs/updates/*.sql` for recent changes.
    - OR Query the database schema directly.
    - **Never** assume standard naming conventions (e.g., `is_admin`) apply without evidence.

### C. Syntax Verification
*   **Rule**: Use syntax specific to the active technology.
*   **Action**: 
    - If `mssql`, do NOT use `ALTER TABLE X ADD COLUMN Y` (invalid `COLUMN` keyword).
    - If `Azure Functions`, verify v3 vs v4 logging (`context.log` vs `context.error`).

---

## 3. Implementation Plan Requirement
For every task involving code changes:
1.  **List Affected Files**: Identify all files to be created or modified.
2.  **List Dependencies**: Identify all files that *supply* logic to the affected files.
3.  **Context Check**: Confirm that all "List Dependencies" files have been read or verified in the current session.

## 4. Recovery Protocol
If an error occurs due to missing context (e.g., `Invalid column name`):
1.  **Stop**: Do not "try again" with a guess.
2.  **Investigate**: Use `view_file` or SQL queries to find the *definitive* source of truth.
3.  **Document**: Update this protocol if a new category of assumption is identified.
