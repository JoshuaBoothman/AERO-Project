# Delete Unpaid Orders

## Goal
Allow users to delete their own orders that are in a 'Pending' status (unpaid). This action should free up any reserved resources (Campsites, Assets, Stock) and remove the order from the user's history.

## User Review Required
> [!IMPORTANT]
> **Database Changes**: No schema changes are strictly required IF the `status` column in `attendees` allows the value 'Cancelled'. If there is a strict CHECK constraint, you may need to alter it.
> 
> **Logic**: The deletion process is **destructive**. It will:
> 1.  Permanently delete the `orders` and `order_items` records.
> 2.  Permanently delete linked `campsite_bookings`, `asset_hires`, and `subevent_registrations`.
> 3.  Restore stock for Merchandise.
> 4.  Mark associated `attendees` as 'Cancelled' (to preserve the record but invalidate the ticket).

## Proposed Changes

### Database (Manual SQL Script)
Although no schema changes are strictly needed for the deletion itself (assuming standard string fields), it is good practice to ensure indices exist for performance, and to verify the `status` column.

Run this script to ensure the `attendees` status column can accept 'Cancelled' (conceptually - this script just checks constraints if they exist, or you can run it to be safe).

```sql
-- OPTIONAL: Verify if a check constraint exists on attendees.status
-- If you have a CHECK constraint enforcing specific status values, you must add 'Cancelled' to it.
-- Example of adding 'Cancelled' if using a check constraint (generic T-SQL):
-- ALTER TABLE attendees DROP CONSTRAINT [CK_Attendees_Status];
-- ALTER TABLE attendees ADD CONSTRAINT [CK_Attendees_Status] CHECK (status IN ('Registered', 'CheckedIn', 'Cancelled', 'Withdrawn'));

-- If no CHECK constraint exists, no action is needed here.
```

### API
#### [NEW] `api/src/functions/deleteOrder.js`
Create a new Azure Function to handle the deletion transactionally.

**Logic:**
1.  **Validate**: Check JWT. Ensure Order belongs to User. Ensure Order Status is 'Pending'.
2.  **Transaction**:
    *   **Get Order Items**: Fetch all items linked to the order.
    *   **Restore Stock**: For every item of type 'Merchandise', increment `product_skus.current_stock` by the quantity (count of items).
    *   **Cancel Attendees**: For items of type 'Ticket', update the linked `attendees.status` to 'Cancelled'.
    *   **Clean Resources**:
        *   DELETE `campsite_bookings` where `order_item_id` in (target items).
        *   DELETE `asset_hires` where `order_item_id` in (target items).
        *   DELETE `subevent_registrations` where `order_item_id` in (target items).
        *   DELETE `subevent_registration_choices` (cascade handling or manual delete via registration id).
    *   **Delete Items**: DELETE `order_items` where `order_id` = @orderId.
    *   **Delete Order**: DELETE `orders` where `order_id` = @orderId.

### Frontend
#### [MODIFY] `client/src/pages/MyOrders.jsx`
-   Update the UI to include a "Delete Order" button for orders with status 'Pending'.
-   **Location**: Inside the Order Card, typically aligned right, perhaps below the price or next to the status badge.
-   **Interaction**:
    *   Clicking "Delete" triggers a `ConfirmationModal` ("Are you sure you want to delete this unpaid order? This action cannot be undone.").
    *   On confirm, call `DELETE /api/orders/{id}`.
    *   On success, remove the order from the local list (`orders` state) to reflect changes immediately without full reload.

## Verification Plan

### Automated Tests
*   **API Test**: Use a script to create a dummy pending order and then delete it.
    *   Create order via `POST /orders` (using existing `createOrder` logic or manual insert if easier, but `createOrder` ensures all side effects like stock are active).
    *   Verify stock deducted.
    *   Call `DELETE /api/orders/{id}`.
    *   Verify order is gone 404.
    *   Verify stock restored.
    *   Verify campsite/asset is free.

### Manual Verification
1.  **Login** as a standard user.
2.  **Create an Order**: Add a ticket, a campsite, and a merchant item to the cart. Proceed to checkout but **do not pay** (leave as Pending).
3.  **Check Status**: Go to "My Orders". Verify order is visible and "Pending".
4.  **Delete**: Click "Delete". Confirm the modal.
5.  **Verify UI**: Order disappears from list.
6.  **Verify Backend**:
    *   Check `orders` table (should be gone).
    *   Check `campsites` availability (should be available again).
    *   Check `product_skus` Inventory (should be restored).
