---
name: session-start
description: Use this skill when the user says "Start session", "Good morning", "Initialize", or begins a new work block. It establishes context and prevents hallucinations.
---

# Goal
To orient the agent with the latest project status, verify database connectivity, analyze pending implementation plans, and ground the agent in the actual database schema.

# Instructions
1.  **Time Check**:
    * Note the current time. This will be required for the "Session End" log.
2.  **Inbox Check (New)**:
    *   **Action**: List the contents of the `inbox/` directory.
    *   **Action**: If files exist, analyze them. If an item is a modification of an existing implementation plan, update the existing plan (do not create a new one). If it is new, ask the user for context.
3.  **Context Loading**:
    * Read `docs/Development_Log.md` to review the last entry and open items.
    * Read `docs/task.md` (if active) to see immediate priorities.
    * Read `docs/ROADMAP.md` for high-level direction.
4.  **Plan Analysis (New Feature)**:
    * **Action**: List and read all markdown files currently in the `docs/implementation_plans/` directory.
    * **Reasoning**: Identify which features are planned but not yet moved to the `completed` folder.
    * **Synthesis**: Compare these plans against the `Development_Log` (what was just finished) and the `ROADMAP`. Determine the most logical `implementation_plan` to tackle next based on dependencies and project flow.
4.  **Schema Grounding (CRITICAL)**:
    * *Constraint:* Do not assume table names or column names based on code.
    * **Action**: Execute a query to fetch the current table list from the database (e.g., `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES`).
    * *Reasoning:* This loads the *actual* schema into your context window immediately.
5.  **Report**:
    * Greet the user.
    * Summarize the last logged activity.
    * **Recommendation**: Explicitly state: "Based on the pending implementation plans, I recommend we start on [Feature Name] from [Filename]. Should we proceed with this?"
    * **Wait**: Do *not* begin coding or generating scripts until the user confirms.
    * Confirm database is connected and schema is loaded.