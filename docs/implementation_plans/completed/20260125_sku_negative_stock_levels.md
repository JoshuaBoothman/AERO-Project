# Negative Stock Levels Implementation Plan

# Goal Description
Enable the system to allow purchases of products even when the stock count is zero or less. The system should track negative stock levels (representing backorders/orders to fill) effectively. This applies to both standalone merchandise purchases and merchandise included with tickets.

# User Review Required
> [!NOTE]
> This change allows users to purchase unlimited quantities regardless of stock. Administrators must monitor stock reports to fulfill orders that exceed current inventory.

# Proposed Changes

## Backend

### API Functions
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   **Remove Stock Checks**:
    -   Locate the "Included Merchandise" section (around line 368) and remove the `if (mStock < 1)` check.
    -   Locate the "Process MERCHANDISE Items" section (around line 512) and remove the `if (currentStock < qty)` check.
-   **Maintain Logic**:
    -   Keep the `UPDATE product_skus SET current_stock = current_stock - @qty` logic. This will naturally drive the stock into negative values.

## Frontend

### Components
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
-   **Update Merchandise Selection**:
    -   Remove the `disabled={sku.stock < 1}` prop from the SKU select dropdown options.
    -   Remove the `(Out of Stock)` text label from the dropdown options.

#### [MODIFY] [ProductModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/ProductModal.jsx)
-   **Update Add to Cart Logic**:
    -   Remove the `if (matchedSku.stock <= 0) return notify(...)` check in `handleAdd`.
-   **Update UI**:
    -   Remove the "Sold Out" badge/text.
    -   Change the button text logic to always show "Add to Cart" instead of "Sold Out".
    -   Remove `disabled` attribute from the Add to Cart button based on stock.

# Verification Plan

## Manual Verification
1.  **Preparation**:
    -   Identify a product SKU and set its stock to 0 via the database or Admin panel (if available).
2.  **Test Case 1: Standard Merchandise Purchase**
    -   Go to the Store Page.
    -   Select the product with 0 stock.
    -   Verify "Add to Cart" button is active (not "Sold Out").
    -   Add to cart and checkout.
    -   **Expected Result**: Order completes successfully.
    -   **Database Check**: Verify `current_stock` for that SKU is now `-1` (or `-qty`).
3.  **Test Case 2: Ticket Included Merchandise**
    -   Select a ticket type that includes merchandise.
    -   In the Attendee Modal, select a merch option that has 0 stock.
    -   **Expected Result**: Option is selectable and not marked "Out of Stock".
    -   Complete checkout.
    -   **Database Check**: Verify `current_stock` decremented correctly.
