---
name: session-end
description: Use this skill when the user says "Wrap up", "End session", "Done for today", or "Commit changes".
---

# Goal
To strictly follow the project's documentation standards and prepare for a manual git commit.

# Instructions
1.  **Implementation Plans**:
    * Check `docs/implementation_plans/`.
    * If a feature was completed, ask the user if the corresponding plan file should be moved to `docs/implementation_plans/completed/`.
    * Perform the file move if confirmed.
2.  **Development Log**:
    * Draft a new entry for `docs/Development_Log.md`.
    * **Header**: `## [YYYY-MM-DD] - <Short Summary>`
    * **Time Log**: Include the Start Time (from session start) and End Time (now).
    * **Content**: Bullet points of Completed Items, decisions made, and Next Steps.
    * **Action**: Write this content to the file.
3.  **Git Commit**:
    * Generate a concise, conventional commit message (e.g., `feat: ...` or `fix: ...`).
    * **Constraint**: Do NOT run the commit command. Display the message for the user to copy/paste.