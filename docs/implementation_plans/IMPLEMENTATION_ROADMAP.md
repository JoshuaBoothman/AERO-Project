# Implementation Roadmap

This document outlines the logical order for completing the pending implementation plans. The order is based on technical dependencies, UX impact, and user-specified priorities.

## Priority Area 1: Essential UX & Navigation Fixes
These changes address immediate usability issues with high impact and relatively low risk.

1. [x] **[Mobile Store Tab Navigation Fix](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-menu-scroll-mobile-fix.md)**
   - *Why first?* Essential for users to discover all store categories (Hire, Camping) on mobile.
2. [x] **[Standardise Date of Birth Picker](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-date-of-birth-date-picker.md)**
   - *Why?* Resolves a major friction point during primary registration flow.
3. [x] **['Register Now' Navigation Logic](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-register-navigation.md)**
   - *Why?* Streamlines the entry point to the ticket purchase flow.

## Priority Area 2: Logic Refinement & Admin Tooling
These changes improve data integrity and solve specific transaction-level hurdles.

4. [x] **[Fix Asset Hires List Duplication](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-asset-hires-list-fix.md)**
   - *Why?* Ensures accurate reporting for admins before adding more asset features.
5. [x] **[Pit Crew to Pilot Linking (In-Cart)](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-pit-crew-pilot-linking.md)**
   - *Why?* Fixes a logic gap where users couldn't link tickets in a single transaction.

## Priority Area 3: Feature Enhancements
Expanding system capabilities beyond the core fixes.

6. [ ] **[Campsite Booking: Extended Dates & Report Names](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-campsite-booking-dates.md)**
   - *Why?* Adds flexibility for campers and improves admin visibility.
7. [ ] **[Asset Hire Options (Dropdown per Type)](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260211-asset-hire-options.md)**
   - *Why?* Requires a database schema update; best done once the base asset list is fixed (Step 4).

## Priority Area 4: Major Changes (Final Phase)
As specifically requested, these major revamp and integration tasks are scheduled last.

8. [ ] **[Home Page Revamp](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260202_home_page_revamp.md)**
   - *Priority:* Low (Per User Request).
9. [ ] **[Square Payment Integration](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/Square_Integration.md)**
   - *Priority:* Specialized (Per User Request). High impact integration.

---

*Last Updated: 2026-02-12*
