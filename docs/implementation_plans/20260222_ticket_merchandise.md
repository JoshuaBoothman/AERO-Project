# Ticket Merchandise Linking

## Goal Description
Allow tickets to include free merchandise (e.g., "T-Shirt included"). When purchasing such a ticket, the user must be prompted to select the specific merchandise item (SKU) which is then added to their cart at typically $0.00 cost.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Add `includes_merch` (bit) and `product_id` (int, nullable, FK to products) to `event_ticket_types`.

## Proposed Changes

### Database
#### [MODIFY] [check_schema_v2.js](file:///c:/laragon/www/AERO-Project/check_schema_v2.js)
-   Add columns to `event_ticket_types`:
    -   `includes_merch` (bit, default 0)
    -   `product_id` (int, nullable)

### Backend (API)
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
-   Update CRUD to handle `includes_merch` and `product_id`.

#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
-   Ensure ticket types return the new fields.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
-   **Validation**: If an order item is a merchandise item with price $0.00, verify it is linked to a purchased ticket that allows it. (Optional but recommended for security).

### Frontend (Client)
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
-   **Ticket Modal**:
    -   Add "Includes Merchandise?" toggle.
    -   If Yes, show "Select Product" dropdown (fetch active products).

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/public/AttendeeModal.jsx) OR [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
-   **Selection Logic**:
     -   When a user selects a ticket that `includes_merch`, trigger a "Select Option" modal for that product (reuse `ProductDetails` logic or similar).
     -   Add the selected SKU to the `cart` with `price: 0`.
     -   Maintain a link between the Ticket Item and the Merch Item in the cart if possible, or just treat them as separate line items.

## Verification Plan
### Manual Verification
1.  **Admin**: Configure a "Gold Pass" to include a "2026 Event Shirt".
2.  **User**: Select "Gold Pass".
3.  **UI**: Verify prompt appears to select Shirt Size/Color.
4.  **Cart**: Verify Shirt is added to cart at $0.00.
5.  **Checkout**: Complete order. Verify Shirt and Ticket are both in the order.
