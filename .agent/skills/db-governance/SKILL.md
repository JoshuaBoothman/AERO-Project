---
name: db-governance
description: Use this skill whenever the user asks for a database change, schema update, or new table.
---

# Goal
To ensure all database changes are safe, manual, and applied to both Dev and Master environments.

# Constraints
* **NEVER** execute DDL (CREATE, ALTER, DROP) statements directly.
* **NEVER** guess column names. Always verify with `sp_help` or `INFORMATION_SCHEMA` before suggesting queries.

# Instructions
1.  **Analyze Request**: Determine what table/column changes are needed.
2.  **Draft Script**:
    * Write a T-SQL script compatible with SQL Server (Azure SQL).
    * Include comments indicating this must be run on **BOTH** `sqldb-aero-dev` and `sqldb-aero-master`.
    * Wrap changes in checks (e.g., `IF NOT EXISTS...`) to make them idempotent if possible.
3.  **User Review**:
    * Present the script to the user.
    * **STOP** and ask: "Please run this in SSMS on both Dev and Master. Let me know when completed."
4.  **Verification**:
    * Once the user confirms execution, run a `SELECT` or `sp_help` query to verify the change is visible to the agent before writing any backend code.