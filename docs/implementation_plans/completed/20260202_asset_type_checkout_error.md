# Asset Type Checkout Error Fix

## Goal Description
Resolve the "Checkout Failed: Asset Type undefined not found" error that occurs when users attempt to purchase an Asset Hire (e.g., Glamping, Golf Cart) via the `Secure Pay Now` button.

The issue is caused by the Checkout process expecting an `id` field on Asset items in the cart, which is currently undefined. The item actually contains `assetTypeId` and `assetId`, but not `id`. The backend expects a valid ID to check stock levels.

## User Review Required
> [!NOTE]
> This fix will work for both new items added to the cart AND existing items already in a user's cart (saved in Local Storage). No action is needed from users to clear their carts.

## Proposed Changes

### Client (Frontend)

#### [MODIFY] [Checkout.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Checkout.jsx)
- Update the payload construction for `assets` to correctly extract the Asset ID.
- Change `assetId: a.id` to use `a.assetTypeId || a.assetId || a.id`.
- Explicitly include `assetTypeId` in the payload to match updated backend expectations.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Update `handleAddAssetToCart` to explicitly set the `id` property on the cart item (using `asset.id`).
- This ensures consistency for future cart items.

## Verification Plan

### Manual Verification
1.  **Add Asset to Cart**: Go to the Store page, select an Asset (e.g., Golf Cart), choose dates, and add to cart.
2.  **Inspect Cart**: Verify via React DevTools or Console that the cart item now has an `id`.
3.  **Checkout**: Proceed to Checkout and click "Secure Pay Now".
4.  **Verify Success**: Ensure the order is created successfully and no "Asset Type undefined" error appears.
5.  **Test Legacy Cart**: (Optional) Manually modify Local Storage to remove the `id` from an asset item and verify Checkout still works (testing the fallback logic).
