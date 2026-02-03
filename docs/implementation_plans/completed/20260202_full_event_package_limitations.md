# Payment Restrictions for Short Camping Stays

This plan outlines the changes required to restrict the "Full Event Package" pricing option for camping bookings. The goal is to ensure that this package is only available for stays exceeding 4 nights. If a user selects 4 nights or fewer, they must pay the daily rate.

## User Review Required

> [!IMPORTANT] 
> **Business Logic Confirmation**: The restriction is strictly "4 nights or less". This means a 5-night stay *can* access the Full Event Package price.
>
> **Backend Enforcement**: We will enforce this on the API side as well to prevent any "hacked" requests from bypassing the frontend.

## Proposed Changes

We will modify the frontend to disable the option and the backend to reject it if invalid.

### Backend (`api`)

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   **Logic Update**: In the campsite processing loop (Section 4), specifically where `totalFull` (Full Event Price) is calculated.
-   **Change**: Wrap the `totalFull` calculation in a conditional check:
    ```javascript
    // Only allow full event rate if stay is > 4 nights
    if (full_event_price && nights > 4) {
        // ... calculate totalFull
    }
    ```
-   **Effect**: If `nights <= 4`, `totalFull` remains `null`. If the frontend sends a price matching the full event price (which would be lower/capped), the `isValidPrice` check will fail because `totalFull` is null, and the backend only checks against `totalDaily`. The order will be rejected with an "Invalid price" error.

### Frontend (`client`)

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
-   **Logic Update**: Calculate `nights` in the render scope of the "Full Event Package" checkbox (sidebar).
-   **Condition**: `const isShortStay = nights <= 4;`
-   **UI Change**: 
    -   Disable the checkbox if `isShortStay` is true.
    -   If currently checked and `isShortStay` becomes true (due to date change), automatically uncheck it.
    -   Add a small text or tooltip: "Available for stays of 5+ nights only."

#### [MODIFY] [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx)
-   **Logic Update**: Similar to `CampingPage.jsx`, calculation of `nights` based on `startDate` and `endDate`.
-   **Condition**: `const isShortStay = nights <= 4;`
-   **UI Change**: 
    -   Disable the "Full Event Package" checkbox if `isShortStay` is true.
    -   Uncheck if necessary.
    -   Force the user to use daily pricing for short stays.

## Database Changes

No schema changes are required as this is a logic constraint based on the existing `full_event_price` column.

## Verification Plan

### Automated Tests
-   **No existing automated tests** for this specific pricing logic were found.
-   **Manual Testing via Browser** will be the primary verification method.

### Manual Verification
1.  **Frontend Constraint**:
    -   Go to a Camping Page for an event.
    -   Select dates covering 4 nights (e.g., Mon-Fri).
    -   Verify "Full Event Package" checkbox is disabled/greyed out.
    -   Select dates covering 5 nights.
    -   Verify checkbox becomes enabled.
    -   Select 4 nights again. Verify checkbox unchecks (if it was checked) and disables.
2.  **Backend Enforcement (Optional but recommended)**:
    -   Attempt to send a raw API request (using Postman or `fetch` in console) trying to purchase a 4-night stay with the `price` set to the `full_event_price`.
    -   Expect a 500/400 error from `createOrder` saying "Invalid price".
