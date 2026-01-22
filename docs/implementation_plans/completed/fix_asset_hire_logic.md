# Fix Asset Hire Date Logic (Full Event Mode)

## Goal Description
Fix the "Invalid Date" and "No assets available" issue when booking Assets in "Full Event Package" mode.
The issue is that `AssetSelectionModal.jsx` always passes the daily `hireDates` to the cart, even when `pricingMode` is 'full' (where `hireDates` inputs are hidden and values are null).

## User Review Required
> [!NOTE]
> This fix ensures that when "Full Event Package" is selected, the cart uses the Event Dates (Start/End) instead of the (empty) daily picker dates.

## Proposed Changes

### Frontend (Client)
#### [MODIFY] [AssetSelectionModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AssetSelectionModal.jsx)
-   Update `handleSelect` to determine successful dates based on `pricingMode`.
-   If `pricingMode === 'full'`, use `eventDates`.
-   If `pricingMode === 'daily'`, use `hireDates`.
-   Pass the correct dates object to `onAddToCart`.

## Verification Plan

### Automated Tests
-   None.

### Manual Verification
1.  **Clear Cart**.
2.  **Add Asset (Full Event)**:
    -   Select "Generic Generators" (assuming it defaults to Full or you select "Full Event Pkg").
    -   Verify the dates displayed in the Modal header are the Event Dates.
    -   Click "Select".
    -   **Verify Cart**: Check that the item in the checkout list has valid dates (e.g., "Jul 04 -> Jul 12") and NOT 1970.
3.  **Add Asset (Daily Hire)**:
    -   Select "Daily Hire" toggle.
    -   Pick specific dates (e.g., Jul 5 - Jul 6).
    -   Click "Select".
    -   **Verify Cart**: Check that the item has the specific dates selected.
4.  **Checkout**: Proceed to payment and ensure no SQL errors.
