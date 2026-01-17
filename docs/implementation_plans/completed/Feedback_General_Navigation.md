# General Navigation & Information

## Goal
Improve the main navigation by adding an "Information" section with sub-items for helpful event details, positioning it between "Events" and "Shop".

## User Review Required
> [!NOTE]
> No database schema changes required.

## Proposed Changes

### Frontend
#### [MODIFY] [Header.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Header.jsx)
*   **New Menu Item**: "Information".
    *   **Position**: Between "Events" and "Shop".
    *   **Behavior**: Hover/Click triggers a dropdown menu.
*   **Dropdown Items**:
    1.  **Flightline Roster** (Non-functional Placeholder or explicit "Coming Soon").
    2.  **FAQ** (Non-functional Placeholder).
    3.  **Event Schedule** (Non-functional Placeholder).
*   **Implementation**: use existing Dropdown component if available, or create a simple standard dropdown.

## Verification Plan
1.  **Visual Check**:
    *   Load Home Page.
    *   Verify "Information" appears between "Events" and "Shop".
2.  **Interaction**:
    *   Hover/Click "Information".
    *   Verify Dropdown appears with "Flightline Roster", "FAQ", "Event Schedule".
    *   Verify clicking them does nothing (or shows a "Coming Soon" toast/alert as appropriate for a placeholder).
