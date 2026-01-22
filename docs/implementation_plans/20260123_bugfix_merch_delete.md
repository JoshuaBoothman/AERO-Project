# Bug Fix: Merchandise Deletion

## Goal Description
Fix the reported issue where deleting a merchandise item (e.g., "sweatshirts") fails.

## Investigation Required
- **Error Logs**: Check Azure Function logs for `deleteProduct` or `deleteSKU` errors.
- **Constraints**: Likely a Foreign Key constraint violation (e.g., product is in `order_items` or `carts`).
- **Logic**: Verify if the deletion logic correctly cascades or checks for dependencies.

## Proposed Changes

### Backend [API]
#### [MODIFY] `deleteProduct.js` (or similar)
- Improve error handling to identify WHY deletion fails.
- If it's due to existing orders:
    - **Option A**: Soft Delete (mark `is_active = 0` or `deleted_at`).
    - **Option B**: Block deletion and show clear error ("Cannot delete product with existing orders").
- Ensure `product_skus`, `product_variants`, `event_products` links are handled (either cascaded or checked).

### Frontend [Client]
#### [MODIFY] `ProductEditor.jsx` / `MerchandiseList.jsx`
- Display the specific error message returned from the API instead of a generic failure.

## Verification Plan

### Automated Tests
- Create a test case that attempts to delete a product with existing orders.

### Manual Verification
1.  **Reproduction**:
    - Try to delete "Sweatshirts" (assuming it has orders).
    - Observe error.
2.  **Fix Verification**:
    - Implement fix (likely specific error message or Soft Delete).
    - Try again.
    - Verify correct behavior (either successful "Archive" or clear "Cannot Delete" message).
