# Printable Invoices & Part Payments

- [x] **Database Schema**
    - [x] Add `invoice_number`, `amount_paid` to `orders` table
    - [x] Add `reference`, `payment_date` to `transactions` table
    - [x] Add `address_line_1`, `city`, `state`, `postcode`, `phone` to `organization_settings`
- [x] **Backend Implementation**
    - [x] Update `createOrder.js`: Pending Status, Invoice #
    - [x] Create `recordPayment.js`: Handle partial payments
    - [x] Update `updateOrganizationSettings.js`: Persist Address/Phone
- [x] **Frontend Implementation**
    - [x] Update `OrgSettings.jsx`: Add Address/Contact form
    - [x] Create `Invoice.jsx`: Printable layout with Org Address & Balances
    - [x] Update `OrderDetail.jsx`: Payment History Table
    - [x] Update `AdminOrders.jsx`: Payment Modal
- [x] **Verification**
    - [x] Verify Org Settings Persistence
    - [x] Verify Invoice Layout (Address + Financials)
    - [x] Verify Payment Logic
