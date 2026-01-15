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
