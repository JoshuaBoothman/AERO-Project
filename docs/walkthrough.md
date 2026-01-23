# Walkthrough: Printable Invoices & Part Payments

This update introduces fully branded printable invoices, partial payment tracking, and organization address management.

## 1. Configure Organization Details
To ensure your invoices look professional, add your address and contact details.

1.  Navigate to **Admin > Settings > Organization**.
2.  Scroll to the new **Address & Contact Details** section.
3.  Enter your:
    -   Address Line 1
    -   Town / City
    -   State
    -   Postcode
    -   Phone Number
4.  Click **Save Settings**.
    -   *Verification*: Refresh the page to ensure details persist.

## 2. Generate and View an Invoice
All orders (past and future) now have an Invoice Number and printable view.

1.  Navigate to **Admin > Orders** (or **My Orders** as a user).
2.  Click **View** on an order.
3.  On the Order Detail page, click the new **📄 View / Print Invoice** button.
4.  **Verify**:
    -   Organization Logo, Address, and Phone are visible in the header.
    -   **Invoice #** is displayed (Format: `INV-{YYYY}-{ORDER_ID}`).
    -   **Bill To** section shows the customer's details.
    -   **Balance Due** is calculated correctly.
    -   **Bank Details** are shown at the bottom for unpaid/partially paid orders.

## 3. Record a Payment (Admin Only)
Admins can now record partial or full payments received via Direct Deposit or Cash.

1.  Navigate to **Admin > Orders**.
2.  Find a "Pending" order.
3.  Click the new **Pay** button in the Action column.
4.  In the "Record Payment" modal:
    -   **Amount**: Enter a partial amount (e.g., $50.00).
    -   **Date**: Select today's date.
    -   **Reference**: Enter a simulated reference (e.g., `DD-TEST-01`).
    -   **Method**: Select "Direct Deposit".
5.  Click **Record Payment**.
6.  **Verify**:
    -   Order status changes to **Partially Paid** (if partial) or **Paid** (if full).
    -   The "Paid" amount is updated in the list view.
    -   Go to the **Order View** -> **Payment History** section to see the transaction log.

## 4. Check Balance Due
1.  On the **Order Detail** page of a partially paid order:
    -   Verify the **Due** amount (Red text) is correct.
    -   Verify the **Payment History** table lists your recent payment.
2.  Open the **Printable Invoice** again.
    -   Verify the **Less Amount Paid** and **Balance Due** rows are correct.
