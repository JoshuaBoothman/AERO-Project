# Printable Invoices & Part Payments

## Goal
Enable users to generate printable invoices for Direct Deposit payments. Allow Admins to record **partial payments**, tracking the balance and updating the order status accordingly (Pending -> Partially Paid -> Paid). Ensure invoices contain full Organization details (Address/Phone).

## User Review Required
> [!IMPORTANT]
> **Part Payment Logic**: 
> - Orders will now track `amount_paid`. 
> - Statuses will generally be:
>     - **Pending**: Paid $0.00
>     - **Partially Paid**: Paid > $0.00 but < Total
>     - **Paid**: Paid >= Total

## Proposed Changes

### Database
#### [MODIFY] [schema_updates](file:///c:/laragon/www/AERO-Project/20260123_add_invoice_number.sql)
- **Orders**: Add `invoice_number`, `amount_paid`.
- **Transactions**: Add `reference`, `payment_date`.
- **Organization Settings**: Add `address_line_1`, `city`, `state`, `postcode`, `phone_number`.

### Backend (API)
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Default `payment_status` to `'Pending'`, `amount_paid` to `0.00`.
- Generate `invoice_number`.

#### [NEW] [recordPayment.js](file:///c:/laragon/www/AERO-Project/api/src/functions/recordPayment.js)
- Logic for partial payments and status updates.

#### [MODIFY] [updateOrganizationSettings.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateOrganizationSettings.js)
- Handle new address/phone fields.

#### [MODIFY] [getOrderDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getOrderDetail.js)
- Return invoice/payment details.

### Frontend (Client)
#### [NEW] [Invoice.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Invoice.jsx)
- **Header**: Display Org Address & Phone clearly.
- **Financials**: Show Total, Paid, Balance Due.

#### [MODIFY] [OrgSettings.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/OrgSettings.jsx)
- Add Section: "Organization Address & Contact".
- Inputs: Address, Town, State, Postcode, Phone.

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
- Show Payment History & Balance.

#### [MODIFY] [AdminOrders.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminOrders.jsx)
- "Record Payment" Modal.

## Verification Plan

### Manual Verification
1.  **Org Settings**:
    - Add Address/Phone details -> Save -> Reload.
2.  **Invoice**:
    - Verify new Address/Phone details appear on the printable invoice.
3.  **Part Payments**:
    - Verify Start -> Partial -> Paid flow.
