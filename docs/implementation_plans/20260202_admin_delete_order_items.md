# Admin Order Item Deletion Implementation Plan

## Goal Description
Allow administrators to delete individual items from **Pending** orders. This feature is crucial for correcting orders before payment without needing to cancel and re-create the entire order. The system must ensure stock levels, bookings, and attendee statuses are correctly reversed/updated. Additionally, admins should have the option to send an updated invoice notification to the customer.

## Logic Explanation

The deletion logic varies by item type to ensure data integrity:
1.  **Merchandise**: Stock quantity will be incremented in `product_skus` for the specific SKU.
2.  **Campsites**: The corresponding record in `campsite_bookings` will be deleted, freeing up the site for those dates.
3.  **Assets**: The record in `asset_hires` will be deleted, returning the asset to the available pool.
4.  **Subevents**: The `subevent_registrations` record (and associated choices) will be deleted.
5.  **Tickets**: The linked `attendees` record will NOT be deleted (to preserve history/ticket codes if needed) but its status will be updated to `'Cancelled'`.

After deletion:
-   The item is removed from `order_items`.
-   The Order's `total_amount` is recalculated.
-   If "Resend Invoice" is selected, an email is sent to the customer with a link to the updated invoice.

## User Interface

### Admin Order Details (`OrderDetail.jsx`)
-   **Condition**: The "Delete" button will only appear if:
    -   User is an Admin (or Operational).
    -   Order Payment Status is 'Pending'.
-   **Placement**: Next to the existing "Refund" button (which is for Paid orders) or in the same action column.
-   **Interaction**: Clicking "Delete" opens a confirmation modal.

### Confirmation Modal
-   **Title**: Delete Item
-   **Message**: "Are you sure you want to delete **[Item Name]**? This action cannot be undone. Stock and availability will be restored instantly."
-   **Controls**:
    -   [Checkbox] "Email updated invoice to customer" (Default: Checked)
    -   [Cancel Button]
    -   [Delete Button] (Destructive Red)

## Proposed Changes

### Backend (`api/src`)

#### [NEW] [deleteOrderItem.js](file:///c:/laragon/www/AERO-Project/api/src/functions/deleteOrderItem.js)
New Azure Function to handle the deletion request.
-   **Route**: `DELETE orders/{orderId}/items/{itemId}`
-   **Body**: `{ resendInvoice: boolean }`
-   **Logic**: Implements the resource cleanup described above.

#### [MODIFY] [emailService.js](file:///c:/laragon/www/AERO-Project/api/src/lib/emailService.js)
-   Add `sendInvoiceUpdateEmail(email, firstName, orderId, invoiceNumber, siteUrl)` function.
-   Template: "Your order #[ID] has been updated. Please view your new invoice here: [Link]".

### Frontend (`client/src`)

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
-   Add `isDeleteItemModalOpen`, `itemToDelete` state.
-   Add `Delete` button logic.
-   Add Modal UI.
-   Implement `handleDeleteConfirm` function to call the API.

## Database Changes
No schema changes required. Manual SQL script provided below if needing to manually clean up stranded data during testing.

### Proposed SQL Script (For Manual Testing/Cleanup)
```sql
-- Check for stranded bookings (bookings with no valid order item)
SELECT * FROM campsite_bookings WHERE order_item_id NOT IN (SELECT order_item_id FROM order_items);
SELECT * FROM asset_hires WHERE order_item_id NOT IN (SELECT order_item_id FROM order_items);

-- Example: Delete an item manually (Replace @ItemId)
-- DECLARE @ItemId INT = 123;
-- DELETE FROM campsite_bookings WHERE order_item_id = @ItemId;
-- DELETE FROM order_items WHERE order_item_id = @ItemId;
```

## Verification Plan

### Automated Tests
None currently available for this flow.

### Manual Verification
1.  **Setup**:
    -   Log in as Admin.
    -   Create a "Pending" order with multiple items: 1x Merchandise, 1x Campsite, 1x Ticket.
    -   Note the initial Stock Level of the Merchandise SKU.
    -   Note the "Booked" status of the Campsite.

2.  **Test Deletion (Merch)**:
    -   Go to Admin Order Details.
    -   Click "Delete" on the Merchandise item.
    -   Select "Resend Invoice".
    -   Confirm.
    -   **Verify**: 
        -   Item disappears from list.
        -   Order Total reduces by item price.
        -   Stock Level increments by 1.
        -   Email is received.

3.  **Test Deletion (Campsite)**:
    -   Delete the Campsite item.
    -   **Verify**: 
        -   Item disappears.
        -   Campsite becomes available again on the Map.

4.  **Test Deletion (Ticket)**:
    -   Delete the Ticket item.
    -   **Verify**: 
        -   Item disappears.
        -   Attendee status shows as 'Cancelled' in Attendees List.

5.  **Test Restriction**:
    -   Open a "Paid" order.
    -   **Verify**: Delete button is NOT visible.
