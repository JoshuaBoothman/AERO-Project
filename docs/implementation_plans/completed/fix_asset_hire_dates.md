# Fix Asset Hire Dates and ID (Cart Issue)

## Goal Description
Fix the "Invalid Date" and "Cannot insert NULL into hire_start_date" error when checking out Asset Hires.
The issue is that `StorePage.jsx`'s `handleAddAssetToCart` function ignores the `specificItem` and `dates` arguments passed from `AssetSelectionModal.jsx`.

## User Review Required
> [!NOTE]
> This fix ensures that the specific Asset Item (Inventory Unit) and the selected Date Range are correctly saved to the Cart.

## Proposed Changes

### Frontend (Client)
#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
-   Update `handleAddAssetToCart` signature to `(asset, specificItem, dates)`.
-   Update cart item construction to include:
    -   `id`: Use `specificItem.asset_item_id` (The specific unit ID).
    -   `checkIn`: `dates.start`.
    -   `checkOut`: `dates.end`.
    -   `identifier`: `specificItem.identifier` (For display in cart).
    -   `assetTypeId`: `asset.id` (For reference).

## Verification Plan

### Automated Tests
-   None.

### Manual Verification
1.  **Clear Cart**: Ensure cart is empty.
2.  **Add Asset**:
    -   Go to Store -> Hire Assets.
    -   Click "View Available Items".
    -   Select Dates (e.g., Tomorrow to Day After).
    -   Select a specific item (e.g., "GEN-001").
3.  **Inspect Cart**:
    -   Verify the item in the cart shows the correct dates (e.g., "Jan 23 -> Jan 24").
    -   Verify the price is correct.
4.  **Checkout**:
    -   Proceed to checkout.
    -   Verify determining "Success" without the SQL NULL error.
