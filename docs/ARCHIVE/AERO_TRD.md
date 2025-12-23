AERO - Technical Requirements Document (TRD)

1. Executive Summary

Project Name: AERO (Aeromodelling Event Registration & Operations)
Client: Australian Large Scale Models (ALSM) / Resellable SaaS
Goal: Develop a scalable, single-tenant event management system for aviation clubs. The system must handle complex logistics (camping, large model compliance) while remaining simple for volunteers to operate.

2. Project Scope

In Scope

Public Portal: User registration, Group/Entity management ("Persons" covers family, friends, or club members), ticket purchase, camping booking, merchandise store, asset hire.

Admin Dashboard: Event configuration, financial reporting, user management.

Operational Tools: Gate check-in (QR/Lookup), asset checkout/return, safety checks.

Data Integrity: Strict separation of Login Accounts (Users) and Human Identities (Persons).

Scalability: Architecture designed for "Clone Event" workflows and potential future resale.

Out of Scope (Phase 1)

Native Mobile Apps (iOS/Android) - Web PWA only.

Complex Compliance Wizards (Simple Boolean checks only).

Multi-tenancy (SaaS) - System is Single Tenant (One DB per Club).

3. User Roles

| Role | Interface | Primary Responsibilities |
| Public User | Mobile / Desktop | Register self/family/friends, buy tickets, book camping, manage pilot profiles. |
| Admin | Desktop | Config event, manage finances, manage inventory, user support. |
| Operational | Tablet / Mobile | Gate operations (Check-in), Safety Officer (Plane checks), Quartermaster (Asset hire). |

4. Technology Stack (Finalized)

Constraint: Azure Static Web Apps (SWA).
Architecture: Serverless / Headless.

Frontend: React (Single Page Application). Hosted on Azure Static Web Apps.

Backend: Node.js (JavaScript) running on Azure Functions (Managed within SWA).

Database: Azure SQL Database (Serverless or vCore).

Why: Aligns with modern "Real World" application standards, provides lowest hosting overhead, and fits the "Serverless" architecture of Azure SWA.

5. Infrastructure Architecture (Azure)

Resource Group: rg-aero-production

Database: Azure SQL Database.

Storage: Azure Blob Storage (Images, Logos, Maps).

Hosting: Azure Static Web Apps (Standard Plan).

Authentication:

Public: Custom Auth (Email/Pass) stored in DB.

Admin: Potential for Microsoft Entra ID (Azure AD) or same Custom Auth.

6. Database Strategy

Engine: SQL Server (T-SQL).

Schema: Relational, Normalized (3NF).

Key Patterns:

organization_settings Singleton for configuration.

order_items Polymorphic association for line items.

product_skus Global inventory vs event_skus Event pricing.

7. Security & Compliance

Payments: Stripe / PayPal integration. PCI Compliance handled by offloading to Gateway (Tokenization).

Data: PII (Personal Identifiable Information) stored secure.

Access Control: Role Based Access Control (RBAC) enforced at Application Layer.