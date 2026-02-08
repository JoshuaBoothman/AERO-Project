# Campsite Booking Mobile View Implementation Plan

**Date:** 2026-02-08  
**Target File:** `c:\laragon\www\AERO-Project\client\src\pages\camping\CampingPage.jsx`, `c:\laragon\www\AERO-Project\client\src\App.css`

## Problem Analysis

The current implementation of the Camping Page uses inline styles to enforce a flexbox layout. Specifically, when the view mode is set to `'map'`, the `flexDirection` is hardcoded to `'row'`.

```javascript
// Current Implementation
<div style={{ display: 'flex', flexDirection: viewMode === 'list' ? 'column' : 'row', gap: '20px' }}>
```

On mobile devices (viewports < 768px), this forces the Map component (which has a `minWidth` logic constraint) and the Sidebar component (fixed width `350px`) to sit side-by-side. Given that mobile screens are typically 375px-430px wide, the `flex-row` layout causes:
1.  **Overflow:** The content extends far beyond the screen width, requiring horizontal scrolling.
2.  **Squishing:** The Sidebar (Booking Details) often takes precedence visually due to the layout order and fixed width, pushing the Map off-screen or making it extremely narrow.
3.  **User Confusion:** Users see the Sidebar first or partially, and must swipe awkwardly to find the Map or the "Map/List" toggle.

The "List" view works correctly because it switches `flexDirection` to `'column'`, naturally stacking the elements.

## Proposed Logic & Implementation

The solution is to move away from inline styles for layout structure and utilize CSS classes with Media Queries. This allows the browser to adapt the layout based on the device width, ensuring a "Mobile-First" experience where necessary.

### 1. CSS Class Extraction
We will replace the inline styles on the main container and its children with semantic CSS classes:
-   `.camping-page-container`: The main flex wrapper.
-   `.camping-map-section`: The section containing the Map and Toggle.
-   `.camping-sidebar-section`: The section containing Date Pickers, Booking Details, and Cart.

### 2. Responsive CSS Rules (Vanilla CSS specified in App.css)

**Desktop (Default):**
-   `display: flex; flex-direction: row; gap: 20px;` (Matches current Map view).
-   Sidebar remains distinct from Map on the right side.

**Mobile (Max-width: 768px):**
-   `flex-direction: column;` (ALWAYS, regardless of view mode).
-   **Order:** Map Section (Top) -> Sidebar Section (Bottom).
-   **Width:** Both sections become `width: 100%`.
-   **Height:** Constrain the Map on mobile (e.g., `height: 50vh`) to ensure the user can still see that there is content below (the Sidebar).
-   **Min-Width Logic:** Override the `minWidth: 1000px` (or similar constraints) on the map container for mobile views to allow it to fit the screen or become horizontally scrollable internally without pushing the page layout wide.

### 3. Detailed Interface Description

#### Mobile Portrait View
1.  **Header:** Standard Navigation/Logo.
2.  **Page Title:** "Event Name: Camping".
3.  **Map / Availability Area (Top Section):**
    -   **Map Toggle:** A clear, floating or header-aligned toggle (Map | List) visible immediately.
    -   **The Map:** Takes up approximately 50-60% of the screen height. users can pan and zoom *within* this area.
    -   **Visuals:** The map container will have a subtle shadow and rounded corners (`border-radius: 12px`) to look like a premium "card" floating on the surface.
4.  **Booking Panel (Bottom Section):**
    -   Located directly below the map.
    -   **Date Selection:** "Check In" and "Check Out" inputs stacked cleanly.
    -   **Check Availability Button:** Full width, high contrast (Dark Mode Black or Primary Color).
    -   **Selected Site Details:** When a user clicks a pin on the map, the page automatically scrolls slightly (smooth scroll) to reveal the "Booking Details" card below the map.
    -   **Cart:** Persistent at the bottom or within the Booking Panel.

#### Desktop View
-   Retains the existing successful layout: Map on Left (flexible width), Sidebar on Right (fixed 350px).
-   Enhanced shadows and spacing for a "cleaner" look.

## Database Changes

**Status:** None Required.

There are no changes to the database schema or data required for this visual update. The existing `campgrounds`, `campsites`, and `events` tables fully support the required data.

### Proposed SQL Script
*No SQL execution is necessary.*

## Detailed Step-by-Step Plan

1.  **Modify `client/src/App.css`**:
    -   Add `.camping-page-container` class.
    -   Add `.camping-map-section` and `.camping-sidebar-section` classes.
    -   Implement `@media (max-width: 768px)` block to switch `flex-direction` to `column` and set widths to `100%`.
    -   Add specific mobile overrides for map container internal scrolling.

2.  **Refactor `client/src/pages/camping/CampingPage.jsx`**:
    -   Remove inline layout styles causing the issue.
    -   Apply the new `className` attributes.
    -   Adjust the Map Container's `minWidth` logic to be responsive (e.g., `minWidth: 100%` on mobile, `minWidth: 0` or specific pixel width on desktop).

3.  **Aesthetic Polish**:
    -   Ensure the Sidebar has a modern card style with `box-shadow: 0 4px 20px rgba(0,0,0,0.08)`.
    -   Improve the "Map | List" toggle appearance for mobile touch targets.
