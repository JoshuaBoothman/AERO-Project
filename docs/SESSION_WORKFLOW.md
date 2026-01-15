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
