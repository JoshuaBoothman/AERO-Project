# Merchandise Quantity Selection Implementation Plan

## Goal Description
Allow users to select a quantity when purchasing merchandise in the Store. Currently, the system defaults to a quantity of 1 for all items.
This change will introduce a `quantity` column to the `order_items` table to efficiently store bulk merchandise purchases (e.g., "5x T-Shirts" as one row instead of 5 rows).
Logic for Tickets, Subevents, and Assets will remain "1 item per row" to maintain their unique linkages (Attendees, Bookings, Hire Dates).

## User Review Required
> [!IMPORTANT]
> **Database Schema Change**: This plan requires adding a `quantity` column to the `order_items` table.
> **Partial Refunds**: With this change, refunding a Merchandise line item will refund the **ENTIRE** quantity (e.g., all 5 shirts). To refund only 1 of 5, a database split would be required (out of scope for this task). The UI will trigger a full refund of the line item.

## Proposed Changes

### Database
#### [SQL Script]
To be executed in SSMS before deployment.
```sql
-- Add quantity column to order_items, defaulting to 1 for existing records
ALTER TABLE order_items
ADD quantity INT NOT NULL DEFAULT 1;

-- Optional: Update existing records if you wanted to merge them, but for safety we leave them as 1.
```

### Client (Frontend)

#### [MODIFY] [ProductModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/ProductModal.jsx)
- **New Feature**: Add a Quantity Counter (Input or +/- buttons) next to the "Add to Cart" button.
- **Logic**: Pass the selected `quantity` to the `onAddToCart` callback.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- **Update**: `handleAddMerch` to accept `quantity` from `ProductModal` and pass it to `addToCart`.
- **Constraint**: Ensure Tickets/Assets/Subevents still default to Qty 1 when adding to cart.

#### [MODIFY] [CartContext.jsx](file:///c:/laragon/www/AERO-Project/client/src/context/CartContext.jsx)
- **Bug Fix**: Update `cartTotal` calculation to respect quantity: `sum + (item.price * (item.quantity || 1))`.
- **Improvement**: `addToCart` should check if an identical item (same ID/SKU/Options) exists and increment its quantity instead of adding a duplicate row.

#### [MODIFY] [Checkout.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Checkout.jsx)
- **UI**: Update `renderItem` to display `Qty: X` if quantity > 1.
- **UI**: Show Total Price per line item (Unit Price * Qty).
- **Payload**: This file already maps `quantity` from the cart item, so it should send the correct payload to the API automatically.

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
- **UI**: Update the item list to show "x [Quantity]" for merchandise items.

### Server (Backend - Azure Functions)

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- **Logic**:
    - **Merchandise**: Remove the `for loop` that duplicates rows. Instead, insert **one** row with the `quantity` value.
    - **Other Types**: Explicitly set equal `quantity` to 1 for Tickets, Assets, Subevents (logic maintains loop for these as they require unique references).
- **Validation**: Enable the stock check logic (uncomment `current_stock < qty` check) to prevent overselling.

#### [MODIFY] [getOrderDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getOrderDetail.js)
- **Query**: Select `oi.quantity`.
- **Output**: Return quantity in the item object so the frontend can display it.

#### [MODIFY] [getAdminOrders.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getAdminOrders.js)
- **Query**: Update `item_count` subquery to `SUM(quantity)` to accurately reflect the number of physical items.

#### [MODIFY] [refundOrderItem.js](file:///c:/laragon/www/AERO-Project/api/src/functions/refundOrderItem.js)
- **Logic**: When refunding Merchandise, restore stock by `item.quantity` instead of hardcoded `1`.

## Verification Plan

### Automated Tests
- None available for this flow.

### Manual Verification
1.  **Database Setup**: Run the SQL script to add the `quantity` column.
2.  **Purchase Flow**:
    - Open Store, select a Merchandise item (e.g., Cap).
    - Select Options (if any).
    - **Test**: Change Quantity to 3.
    - Click "Add to Cart".
    - **Test**: Verify Cart Badge/Total updates correctly (Price x 3).
    - Go to Checkout.
    - **Test**: Verify Checkout list shows "Quantity: 3" and correct Line Total.
    - Complete Purchase.
3.  **Order Verification**:
    - Check Database: `SELECT * FROM order_items WHERE order_id = [ID]`.
    - **Result**: Should see **1 row** with `quantity = 3` and `item_type = 'Merchandise'`.
4.  **Stock Verification**:
    - Check `product_skus` stock level. Should be decremented by 3.
5.  **Refund Verification** (Admin):
    - Refund the item via API (or Admin UI if available).
    - **Result**: Check `product_skus` stock level. Should increment by 3.
