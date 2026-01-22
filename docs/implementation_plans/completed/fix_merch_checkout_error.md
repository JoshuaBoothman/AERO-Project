# Fix Merchandise Checkout Error (Invalid SKU)

## Goal Description
Fix the "Invalid or inactive merchandise SKU: 4" error during checkout. This error occurs because the **Store Page** incorrectly constructs the cart item using the **Product ID** (4) instead of the **SKU ID** (e.g., 23, 24). This is caused by a function signature mismatch between `ProductModal.jsx` and `StorePage.jsx`.

## User Review Required
> [!NOTE]
> No breaking changes. This is a bug fix for the Storefront logic.

## Proposed Changes

### Frontend (Client)
#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
-   Update `handleAddMerch` function signature to match `ProductModal`'s output: `(product, sku)`.
-   Update the cart item construction to:
    -   Use `sku.id` (or `sku.product_sku_id`) as the cart item `id`.
    -   Set `quantity` to 1 (default).
    -   Ensure `price` is taken from the SKU, not just the product.

#### [OPTIONAL] [ProductModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/ProductModal.jsx)
-   (Optional) If `sku.id` is missing in the `matchedSku` object, verified in `getStoreItems` API response, we might need to adjust. *Assumption: `sku.id` exists.*

## Verification Plan

### Automated Tests
-   None.

### Manual Verification
1.  **Clear Cart**: Ensure cart is empty.
2.  **Add Merch**: Go to Store, select "Festival 2026 T-Shirt".
    -   Select options (Size: S, etc.).
    -   Click "Add to Cart".
3.  **Inspect Cart**:
    -   Verify the item in the cart has a valid price (not $0.00 unless free).
    -   (Internal) Verify the `id` of the item in `localStorage` ('cart') is the *SKU ID* (e.g., ~23), not 4.
4.  **Checkout**: Click "Secure Pay Now".
    -   Verify the order processes successfully without the "Invalid SKU" error.
