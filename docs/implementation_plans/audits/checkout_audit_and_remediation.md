# Checkout Flow Audit & Race Condition Analysis

**Date:** 2026-02-15
**Component:** Checkout (Frontend & Backend)
**Auditor:** Antigravity

## 1. Executive Summary

The current checkout implementation correctly uses a SQL Transaction to wrap the order creation process. However, it relies on a "Check then Act" pattern (Select then Insert/Update) without sufficient locking hints or Isolation Level adjustments.

**Critical Finding:** There is a high probability of **Double Booking** (Campsites/Assets) and **Overselling** (Merchandise) under concurrent load (e.g., ticket release events).

## 2. Process Flow Review

### Frontend (`Checkout.jsx`)
-   **Flow Type:** Pessimistic (Inventory Reservation First).
-   **Mechanism:**
    1.  User clicks "Place Order" (Bank Transfer) or "Pay" (Square).
    2.  Frontend calls `/api/createOrder` **first**.
    3.  **Bank Transfer:** If `createOrder` succeeds, redirect to invoice.
    4.  **Square:** If `createOrder` succeeds, frontend calls `/api/processSquarePayment` with the `orderId`.
-   **Observation:** This approach is sound for preventing "Phantom Payments" (paying for items you don't have), but leaves "Pending Orders" in the system if the payment step fails or is abandoned.

### Backend (`createOrder.js`)
-   **Transaction:** Uses `transaction.begin()` which creates a SQL transaction.
-   **Logic Pattern:**
    1.  `SELECT` availability (Check if `campsite_bookings` overlap).
    2.  `IF` booked -> Throw Error.
    3.  `INSERT` into `campsite_bookings`.

## 3. Vulnerability Analysis: Race Conditions

### Scenario: The "Double Book" Race
Two users (User A and User B) attempt to book **Campsite #101** at the exact same second.

1.  **T-0ms**: User A `BEGIN TRAN`.
2.  **T-1ms**: User B `BEGIN TRAN`.
3.  **T-5ms**: User A (`SELECT 1 FROM campsite_bookings ...`)
    -   Result: `NULL` (Empty). No conflicting bookings found.
4.  **T-6ms**: User B (`SELECT 1 FROM campsite_bookings ...`)
    -   Result: `NULL` (Empty). No conflicting bookings found. (User A has not inserted yet).
5.  **T-10ms**: User A `INSERT INTO campsite_bookings ...`. Commit.
    -   **Success.**
6.  **T-11ms**: User B `INSERT INTO campsite_bookings ...`. Commit.
    -   **Success.**
7.  **Result**: Campsite #101 is booked twice for the same dates.

**Mechanism**: The default SQL Isolation Level (Read Committed) only prevents reading dirty data. It does not prevent "Phantom Reads" or "Non-Repeatable Reads". Since User A had not committed the INSERT when User B read, User B saw empty space.

### Merchandise Overselling
Also applicable to `product_skus`.
1.  User A reads `current_stock = 1`.
2.  User B reads `current_stock = 1`.
3.  User A updates `current_stock = 0`.
4.  User B updates `current_stock = 0`.
    -   *Note*: The update `SET current_stock = current_stock - 1` is atomic, so the final result will be `-1`.
    -   While the math is correct, the business rule (`stock >= 0`) is violated.

## 4. Recommendations & Fixes

### 4.1. Add Locking Hints (Immediate Fix)

We must force transactions targeting the same resource to execute **Serially** (one after another) during the Critical Section.

**For Campsites:**
Lock the **Parent Row** (`campsites`) with `UPDLOCK` before checking child bookings. This acts as a Mutex for that specific campsite.

**Current Query:**
```sql
SELECT ... FROM campsites WHERE campsite_id = @cid
```

**Recommended Query:**
```sql
SELECT ... FROM campsites WITH (UPDLOCK, ROWLOCK) WHERE campsite_id = @cid
```
*Effect*: If User A runs this, User B's transaction will **Wait** (block) until User A commits or rolls back. User B will then read the *committed* state (which includes User A's new booking) and fail the validation check.

**For Assets:**
Apply the same logic to the `asset_types` table.
```sql
SELECT ... FROM asset_types WITH (UPDLOCK, ROWLOCK) WHERE asset_type_id = @atid
```

**For Merchandise:**
Three options:
1.  **Atomic Check**: Add the check to the UPDATE statement.
    ```sql
    UPDATE product_skus 
    SET current_stock = current_stock - @qty 
    WHERE product_sku_id = @sid AND current_stock >= @qty
    ```
    Then check `rowsAffected`. If 0, throw "Out of Stock".
2.  **UPDLOCK**: `SELECT ... FROM product_skus WITH (UPDLOCK, ROWLOCK)`.

### 4.2. Pending Order Cleanup
Since `createOrder` reserves stock *before* payment, the system will accumulate "Abandoned" orders (status: 'Pending') that hold valid bookings.

**Recommendation:**
Implement a scheduled task (e.g., cron job every 5 mins) to "Release" inventory for orders that are:
1.  `Pending`
2.  Created > 30 minutes ago.

SQL to Release:
```sql
DELETE FROM campsite_bookings WHERE booking_id IN (SELECT booking_id FROM ... WHERE order is stale)
-- (And cancel the order / items)
```

## 5. Security Note: Data Integrity
Ensure that the "Legacy Claim" logic (checking `o.booking_source = 'Legacy'`) is strictly scoped to `UPDLOCK` queries as well to prevent a user and a legacy import script colliding.

## 6. Implementation Plan Check
The current refactoring plan should include these `WITH (UPDLOCK, ROWLOCK)` hints in `api/src/functions/createOrder.js`.

---
**Report generated by Antigravity**
