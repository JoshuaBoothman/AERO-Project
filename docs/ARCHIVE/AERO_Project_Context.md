AERO Project Context & Restore Point

Project Overview

Name: AERO (Aeromodelling Event Registration & Operations)
Client: Australian Large Scale Models (ALSM)
Goal: Single-tenant event management system (Camping, Assets, Ticketing) for aviation clubs.

Technical Stack

Cloud: Azure Static Web Apps (Standard)

Frontend: React + Vite (located in /client)

Backend: Azure Functions (Node.js/JavaScript) (located in /api)

Database: Azure SQL Database (T-SQL)

Local Env: VS Code, Node.js v22, Azure Functions Core Tools v4.

Infrastructure Status

Database: Live on Azure (sqldb-aero-master). Schema fully applied.

Local Project: Scaffolding complete.

/api: Initialized (Host: node)

/client: Initialized (React + Vite)

/docs: Contains TRD and Schema history.

Database Schema Highlights

Users: users (Login) vs persons (Identity).

Logistics: events -> event_ticket_types (Pricing).

Commerce: orders -> order_items (Polymorphic: links to Camping, Assets, Merch).

Config: organization_settings (Singleton).

Current Development Task

Next Step: Connecting the local Azure Function (api) to the remote Azure SQL Database using the mssql driver.

Pending: Creating the db.js utility file and the first test endpoint.