# Order Item Refunds

## Goal
Allow Admins to mark individual order items as "Refunded".
If the refunded item is **Merchandise**, the system must automatically restore the stock level for that SKU.
This provides accurate stock tracking and visual indication of refunded items in the order history.

## User Review Required
> [!IMPORTANT]
> **Financials**: This feature **only** marks the item as refunded in the database and updates stock. It does **NOT** process actual money refunds (Stripe, Bank, etc.). You must still refund the customer manually via your payment provider.

> [!NOTE]
> **Stock Logic**: Since `order_items` stores one row per single unit (quantity driven by multiple rows), refunding one order item will restore exactly **1 unit** of stock.

## Proposed Changes

### Database
#### [NEW] SQL Script
- Add `refunded_at` column to `order_items`.

```sql
-- Run this in SSMS
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items') AND name = 'refunded_at'
)
BEGIN
    ALTER TABLE order_items ADD refunded_at DATETIME NULL;
    PRINT 'Column refunded_at added to order_items';
END
ELSE
BEGIN
    PRINT 'Column refunded_at already exists';
END
GO
```

### Backend (`api/`)
#### [MODIFY] `src/functions/getOrderDetail.js`
- Select `oi.refunded_at` in the query so the frontend knows the status.

#### [NEW] `src/functions/refundOrderItem.js`
- **Endpoint**: `POST /api/orders/{orderId}/items/{itemId}/refund`
- **Logic**:
    1. Verify Admin permissions.
    2. Check if item exists and is not already refunded.
    3. Transaction:
        - Update `order_items` SET `refunded_at = GETDATE()`.
        - IF `item_type` is 'Merchandise':
            - Update `product_skus` SET `current_stock = current_stock + 1`.
    4. Return success.

### Frontend (`client/`)
#### [MODIFY] `src/pages/OrderDetail.jsx`
- **Admin View**:
    - Add a "Status / Action" column to the Order Summary table (visible only to Admins).
    - If item is `refunded_at` is present -> Show "🚫 REFUNDED" badge with date tooltip.
    - If active -> Show "Refund" button.
- **Interaction**:
    - "Refund" button opens a standard browser `confirm()` or simple modal ("Are you sure you want to mark this item as refunded? Stock will be restored.").
    - On confirmation, call the API and refresh the order details.

## Verification Plan

### Automated Tests
- None planned for this MVP.

### Manual Verification
1. **Setup**:
    - Log in as Admin.
    - Go to an Order with Merchandise.
    - Note the SKU and check current stock in `Merchandise List` or DB.
2. **Action**:
    - Open Order Detail.
    - Click "Refund" on one merchandise item.
    - Confirm dialog.
3. **Verify**:
    - UI shows item as "Refunded".
    - Go to Merchandise List -> Verify stock has increased by 1.
    - Go back to Order Detail -> Verify "Refund" button is gone for that item.
4. **Non-Merchandise**:
    - Refund a Ticket or Subevent.
    - Verify status updates (no stock change expected).
