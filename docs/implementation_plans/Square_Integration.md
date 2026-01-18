# Square Payment Integration

This implementation plan covers the replacement of the current "Mock" payment system with a live Square Payment integration.

## User Review Required
> [!IMPORTANT]
> **Square Credentials Required**:
> We need the user to invite us to their Square Account or provide `SQUARE_ACCESS_TOKEN` and `SQUARE_APP_ID`.
> **Location ID**: We also need the `SQUARE_LOCATION_ID` to attribute sales correctly.

## Proposed Changes

### Configuration
#### [NEW] .env / Azure Application Settings
- Add `SQUARE_ACCESS_TOKEN`
- Add `SQUARE_APP_ID`
- Add `SQUARE_LOCATION_ID`

---

### Backend (api)
**Install**: `square` (Official Node.js SDK)

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Import and initialize `SquareClient` with environment variables.
- Update request payload to accept `paymentNonce` (from frontend).
- **Logic Change**:
    1.  Calculate `totalAmount` (existing logic).
    2.  **NEW**: Call Square `paymentsApi.createPayment`:
        - `sourceId`: `paymentNonce`
        - `amountMoney`: `{ amount: totalAmount * 100, currency: 'AUD' }` (Convert to cents)
        - `idempotencyKey`: Unique ID (e.g., Request ID or Order ID suffix)
    3.  **If Payment Success**:
        - Proceed to insert Order and Order Items into SQL (existing logic, mostly).
        - Save `payment.id` from Square into the `transactions.ref_number` or logic.
    4.  **If Payment Fails**:
        - throw Error (do not create order).

---

### Frontend (client)
**Install**: `react-square-web-payments-sdk`

#### [MODIFY] [Checkout.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Checkout.jsx)
- Import `PaymentForm`, `CreditCard` from `react-square-web-payments-sdk`.
- Remove "Secure Pay Now" button.
- Add `PaymentForm` component:
    - Configure with `applicationId` and `locationId` (expose via `import.meta.env`).
    - **cardTokenizeResponseReceived**:
        - Get `token` (nonce).
        - Call `handleCheckout(nonce)`.
- Update `handleCheckout` function:
    - Accept `nonce`.
    - Include `nonce` in the `createOrder` API payload.

## Verification Plan

### Automated Tests
- None (External API integration is difficult to unit test without mocking `square` client heavily).

### Manual Verification
1.  **Environment Setup**:
    - Add Sandbox Credentials to `.env`.
2.  **Checkout Flow**:
    - Add items to Cart.
    - Go to Checkout.
    - **Verify**: Square Payment Form renders (instead of generic button).
    - Enter **Square Sandbox Card Number** (e.g., `4111 1111 1111 1111`).
    - Click Pay.
    - **Verify**:
        - Frontend shows "Processing...".
        - API receives `nonce`.
        - Square API is called (check Console Logs for "Payment Success").
        - Order is created in Database.
        - User is redirected to `/my-orders`.
