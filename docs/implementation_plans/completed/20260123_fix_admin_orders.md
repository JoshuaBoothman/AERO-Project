# Fix Admin Orders Duplication

## Problem
The Admin Orders list displays duplicate rows for the same order. This occurs because the SQL query performs a `LEFT JOIN` on the `persons` table based on `user_id`. Since a single User account can have multiple Person records (e.g., family members), this join creates a Cartesian product for that user's orders.

## Solution
Replace the `LEFT JOIN persons` with an `OUTER APPLY` that selects only the *first* matching person record (or the most relevant one). This ensures that each Order row corresponds to exactly one User/Person combo.

## Proposed Changes

### [Backend]
#### [MODIFY] [getAdminOrders.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getAdminOrders.js)
- Change the SQL query:
```sql
FROM orders o
LEFT JOIN users u ON o.user_id = u.user_id
OUTER APPLY (
    SELECT TOP 1 first_name, last_name 
    FROM persons 
    WHERE user_id = u.user_id
    ORDER BY person_id ASC -- or some other criteria like is_primary if it existed
) p
```

## Verification Plan
### Manual Verification
1.  **Restart API**: `npm start` in `api/`
2.  **Navigate**: Admin > Orders
3.  **Check**: Verify that Order #68 (and others) appears only *once*.
4.  **Check Customer Name**: Verify that a valid name still appears in the "Customer" column.
