# Campsite Booking People Count Input Fix

**Date:** 2026-02-08  
**Target File:** `client/src/pages/camping/CampingPage.jsx`, `client/src/components/CampsiteModal.jsx`

## Problem Analysis

The "Adults" and "Children" input fields currently use a strict controlled component pattern:

```javascript
onChange={e => setAdults(parseInt(e.target.value) || 1)}
```

When a user attempts to backspace the default value "1", the input becomes an empty string `""`. `parseInt("")` evaluates to `NaN`, and the fallback `|| 1` immediately forces the state back to `1`. This creates a frustrating user experience where the field cannot be cleared to type a new number (e.g., trying to type "2" results in "12" or just "1" if backend-spaced first).

## Proposed Logic & Implementation

To fix this, we will decouple the "temporary typing state" from the "validated persistent state" by allowing the state variables to hold an empty string temporarily.

### 1. State Logic Update
-   **Current:** `adults` is always a `number`.
-   **New:** `adults` can be `number | string` (specifically `""`).

### 2. Event Handlers
-   **onChange:**
    -   If the input value is `""`, set the state to `""`.
    -   If the input value is a valid number, set the state to that number.
-   **onBlur (Focus Out):**
    -   When the user leaves the field, check if the value is `""`.
    -   If it is empty, reset it to the minimum allowed value (1 for Adults, 0 for Children).
    -   This guarantees that validation rules are enforced *after* editing is done, not *during*.

### 3. Render/Calculation Safety
-   During the brief moment the field is empty, calculations (like Price or Cart Items) must not break.
-   We will treat `""` as `0` (or `1` for adults) in any derived calculations (e.g., `const safeAdults = adults === '' ? 1 : adults;`).

### 4. Interface Description (No Visual Changes)
-   **Visuals:** The input fields look identical to the current design (standard text/number inputs).
-   **Behavior:**
    1.  User taps "Adults" input (Value: "1").
    2.  User hits Backspace.
    3.  Input becomes empty (Value: "").
    4.  User types "2".
    5.  Input becomes "2".
    6.  User clicks "Add to Cart".
    7.  System uses "2".
-   **Edge Case:**
    1.  User clears input (Value: "").
    2.  User clicks away.
    3.  Input snaps back to "1" (default).

## Files to Modify

1.  `client/src/pages/camping/CampingPage.jsx`
    -   Update `adults` and `children` inputs in the sidebar.
    -   Update price calculation logic to handle empty string safely.
2.  `client/src/components/CampsiteModal.jsx`
    -   Update `adults` and `children` inputs in the modal toolbar.
    -   Update price calculation logic.

## Database Changes

**Status:** None Required.
This is a frontend-only interaction fix.

### Proposed SQL Script
```sql
-- No database changes are required for this UI fix.
```

## Detailed Step-by-Step Plan

1.  **Modify `client/src/pages/camping/CampingPage.jsx`**:
    -   Update `onChange` for Adults: `e => setAdults(e.target.value === '' ? '' : parseInt(e.target.value))`
    -   Add `onBlur` for Adults: `() => { if (adults === '') setAdults(1); }`
    -   Update `onChange` for Children: `e => setChildren(e.target.value === '' ? '' : parseInt(e.target.value))`
    -   Add `onBlur` for Children: `() => { if (children === '') setChildren(0); }`
    -   Update `handleAddToCart` and Price Calculation sections to ensure `adults` is cast to a number or defaulted to 1 if empty.

2.  **Modify `client/src/components/CampsiteModal.jsx`**:
    -   Apply identical changes to the inputs in the modal.
    -   Ensure `handleConfirm` logic handles the potential empty string state (though `onBlur` usually catches it, aggressive clicking might bypass blur).
