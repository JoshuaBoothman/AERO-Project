# Fix Flight Line Fees in Shop Page

The "No Flight Line Fees" feature fails on the Shop/Store page because the API endpoint `getStoreItems` does not return the surcharge price, and the frontend `StorePage` does not apply this price when adding the ticket to the cart.

## User Review Required
> [!IMPORTANT]
> This change modifies how the cart price is calculated in the Store Page flow. It ensures that if a pilot declines duties, the higher price (`price_no_flight_line`) is added to the cart initially.

## Proposed Changes

### Backend (Admin/API)

#### [MODIFY] [getStoreItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getStoreItems.js)
- Update the SQL query in Step 6 (Fetch Ticket Types) to include `price_no_flight_line`.

### Frontend (Client)

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- In `handleConfirmTicket`:
    - Check if the ticket is a pilot ticket and has `price_no_flight_line`.
    - Check the attendee details (for the single attendee).
    - If `!flightLineDuties`, set the item `price` to `price_no_flight_line`.

## Verification Plan

### Automated Tests
- None available for this UI flow.

### Manual Verification
1.  **Backend Check**: Run `node test_store_api.js` (I will create this) to verify `getStoreItems` returns `price_no_flight_line`.
2.  **Frontend Check**:
    - Go to Store Page (`/store/festival-2026`).
    - Click "Add to Cart" on Pilot Ticket.
    - In Modal, Toggle "Flight Line Duties".
        - Verify "Price: $..." text appears.
    - Uncheck "Flight Line Duties" (Price should be higher).
    - Click "Add to Cart".
    - Check Cart icon/page. Price should reflect the higher amount.
