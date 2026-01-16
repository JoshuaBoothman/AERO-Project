# NotebookLM Workflow

This document outlines the workflow for using Google's NotebookLM with the AERO Project.

## Purpose
We use NotebookLM to have "grounded" brainstorming sessions. By providing NotebookLM with a comprehensive context file that represents the current state of the codebase, database, and documentation, we ensure that its suggestions and answers are relevant and accurate.

## The Context File
The context file is located at:
`docs/NotebookLM_Context.md`

This file is **auto-generated** and aggregates:
- Project Directory Structure
- Package.json dependencies and scripts
- **Live Database Schema** (tables, columns, types)
- Content of all Documentation (`docs/*.md`)
- Root `README.md`
- List of API Functions

## How to Update the Context
Before starting a session with NotebookLM, or after significant changes to the codebase/schema, you should regenerate the context file.

Run the following command from the project root:

```bash
node scripts/generate_notebooklm_context.js
```

This will:
1.  Connect to the development database to fetch the latest schema.
2.  Scan the file system.
3.  Overwrite `docs/NotebookLM_Context.md`.

## Using with NotebookLM
1.  Go to [NotebookLM](https://notebooklm.google.com/).
2.  Create a new Notebook or open an existing "AERO Project" notebook.
3.  **Add Source**: Upload `docs/NotebookLM_Context.md`.
    - *Note: If you have an old version of the context file in the notebook, delete it and upload the new one to ensure consistency.*
4.  Start chatting/brainstorming!

## Troubleshooting
- **Schema Errors**: If the script fails to fetch the schema, ensure your local database is running and `api/local.settings.json` has the correct `SQL_CONNECTION_STRING`.
