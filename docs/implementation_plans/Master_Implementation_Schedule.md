# Master Implementation Schedule

This document outlines the logical order of execution for the pending implementation plans.

## Phase 0: Critical Stability Fixes
*These tasks fix fundamental code issues that can cause runtime crashes, state corruption, and application failures.*

- [x] **[Critical Lint Error Fixes](20260202_lint_critical_fixes.md)**
    - *Goal*: Fix 43 critical ESLint errors including React Hooks violations, undefined variables, and immutability issues.
    - *Scope*: Frontend code quality fixes - No functional changes.
    - *Impact*: **Prevents crashes** in CampingPage, Admin tools, and script failures.
    - *Priority*: **HIGHEST** - These are ticking time bombs that can crash production.

## Phase 1: Critical Bug Fixes & Blockers
*These tasks address broken functionality, data integrity issues, or immediate blockers for users.*

- [x] **[Asset Type Checkout Error](20260202_asset_type_checkout_error.md)**
    - *Goal*: Fix "Asset Type undefined" error preventing checkout of assets.
    - *Scope*: Frontend fix in payload construction.

- [x] **[Mobile Date Selection Bug](20260202_date_selection_mobile.md)**
    - *Goal*: strict server-side/logic validation to preventing selection of dates outside event range (common on mobile).
    - *Scope*: Frontend logic update in `AttendeeModal`.

- [x] **[Subevents Button Visibility](20260202_missing_or_unreachable_button_subevents.md)**
    - *Goal*: Fix "Add to Cart" button being unreachable on small screens in Subevents modal.
    - *Scope*: CSS/Layout fix.

- [x] **[Admin Attendees Ticket Type Fix](20260202_admin_attendees_ticket_type_fix.md)**
    - *Goal*: Fix empty "Ticket Type" dropdown in Admin Attendees list.
    - *Scope*: Frontend property name fix.

- [x] **[Full Event Package Limitations](20260202_full_event_package_limitations.md)**
    - *Goal*: Restrict "Full Event Package" pricing to stays of >4 nights only.
    - *Scope*: Frontend UI disable + Backend logic enforcement.

## Phase 2: Store Enchancements & Database Updates
*These tasks add core functionality to the purchasing flow and require Database schema changes.*

- [x] **[Merchandise Quantity Selection](20260202_order_items_qty.md)**
    - *Goal*: Allow selecting quantity > 1 for merchandise.
    - *Scope*: **DB Change** (add `quantity` to `order_items`), Frontend UI, Backend logic.

- [x] **[Subevent Notes](20260202_subevent_notes.md)**
    - *Goal*: Allow users to add notes (e.g. dietary reqs) to subevent bookings.
    - *Scope*: **DB Change** (add columns to `subevents` and `registrations`), Admin UI, Store UI.

- [ ] **[Flight Line Duties Interface](20260202_display_flight_line_prices.md)**
    - *Goal*: Improve UI for "Flight Line Duties" agreement (Agree/Disagree options with transparent pricing).
    - *Scope*: Frontend UI refactor in `AttendeeModal`.

## Phase 3: Admin Tools & Back-office
*These tasks improve administrative capabilities and data management.*

- [ ] **[Delete Existing Asset Inventory](20260202_delete_existing_asset_inventory.md)**
    - *Goal*: Allow deletion of inventory items even if they have history (implement Soft Delete).
    - *Scope*: Backend logic change (Status='Deleted'), Admin UI update.

- [ ] **[Admin Order Item Deletion](20260202_admin_delete_order_items.md)**
    - *Goal*: Allow admins to remove individual items from Pending orders and restore stock.
    - *Scope*: New Backend Function, Admin UI Update.
    - *Note*: Supersedes `20260131_admin_order_editing.md`.

- [ ] **[Legacy Priority Booking Implementation](20260202_legacy_campsite_bookings.md)**
    - *Goal*: Allow admins to create bookings for users who haven't registered yet ("Shadow Users").
    - *Scope*: New Admin Tool, Auth logic update to "claim" accounts.

## Phase 4: UI/UX Polish & Revamp
*Visual improvements and major page revamps.*

- [ ] **[Campsite Tooltips](20260202_campsite_tooltip.md)**
    - *Goal*: Show availability dates on hover for map pins.
    - *Scope*: Frontend component & API update to return booking dates.

- [ ] **[Home Page Revamp](20260202_home_page_revamp.md)**
    - *Goal*: Replace auto-redirect with a proper Landing Page.
    - *Scope*: New `Home.jsx` layout and content.

---
**Progress Tracking:**
Mark items as `[x]` when completed.
