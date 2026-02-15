# Backend Database Security Audit Report

**Date:** 2026-02-15
**Auditor:** Antigravity (AI Assistant)

## 1. Database Connection Logic (`api/src/lib/db.js`)

**Status:** ⚠️ **Attention Needed (Low/Medium Risk)**

The current implementation uses a global `poolPromise` singleton pattern.
```javascript
let poolPromise;
// ...
if (!poolPromise) {
    poolPromise = sql.connect(config)...
}
return poolPromise;
```

**Observations:**
-   **Connection Recovery:** If the SQL Server connection drops *after* the pool is established, the `mssql` library generally handles reconnection attempts automatically. However, if the `poolPromise` enters a rejected state (e.g. initial connection fails), the logic at line 18 (`poolPromise = null`) correctly resets it for the next try.
-   **Stale Pool Risk:** There is no explicit health check before returning the pool. In rare network scenarios (e.g. IP change, firewall reset), the pool might remain "connected" logic-wise but be broken.
-   **Recommendation:** While standard for Azure Functions (to reuse connections across invocations), ensure that global error handlers log connection fatal errors. No immediate code change is critical unless connection stability issues are observed.

## 2. SQL Injection Vulnerabilities

**Scan Scope:** All files in `api/src/functions`.
**Methodology:** Grep search for string concatenation (`+`) and template literals (`${}`) within `query()` calls, followed by manual review of flagged files.

### Summary of Findings
Most functions correctly use `request.input('@param', type, value)` and execute parameterized queries. Dynamic updates in files like `updateProduct.js` correctly use whitelisted field checks and parameterized values, only concatenating hardcoded column names.

### 🔴 High Risk Files (Manual Parameterization Needed)
*No files were found with direct User Input concatenation into SQL queries.*

### 🟠 Medium Risk / Bad Practice
These files use string interpolation. While currently "safe" due to hardcoded values or internal data sources, they set a dangerous precedent and should be refactored to use parameters.

#### 1. `api/src/functions/debug_camp.js`
-   **Issue:** Uses template literal interpolation for `eventId`.
    ```javascript
    // Line 9
    const eventId = 9; 
    // Line 13
    query(`SELECT * FROM events WHERE event_id = ${eventId}`)
    ```
-   **Why it's flagged:** Although `eventId` is currently hardcoded to `9`, if a developer changes this to `request.query.eventId` without changing the query syntax, it becomes an instant SQL injection vulnerability.
-   **Remediation:** Change to `@eventId` parameter.

### 🟡 Low Risk / Dynamic SQL
#### 1. `api/src/functions/deleteVariantOption.js`
-   **Issue:** Interpolates a list of IDs for a `DELETE ... IN (...)` clause.
    ```javascript
    const skuList = skuIds.join(',');
    query(`DELETE FROM event_skus WHERE product_sku_id IN (${skuList})`)
    ```
-   **Context:** `skuIds` is an array of Integers derived directly from a previous database query. It is not user input.
-   **Verdict:** Safe from external injection, but technically dynamic SQL.
-   **Remediation:** No immediate action required, but moving to Table-Valued Parameters (TVPs) or iterative deletion is cleaner if the list grows large.

## 3. Schema Consistency Check
**Comparison:** `api/src/functions` SQL usages vs `api/scripts/generated_schema.sql`.

-   **Findings:** The queries reviewed map correctly to the defined schema tables and columns.
    -   Tables accessed (`products`, `orders`, `order_items`, `attendees`, etc.) exist in the schema.
    -   Columns accessed (e.g. `campsite_bookings.check_in_date`, `attendees.flight_line_duties`) exist and match data types implied by usage.
-   **Note:** `debug_camp.js` queries `INFORMATION_SCHEMA`, which is a system view and expected to exist.

## 4. Action Plan
1.  **Refactor `debug_camp.js`**: Even though it's a debug file, rewrite it to use `.input('eventId', sql.Int, 9)` to prevent future accidents.
2.  **Monitor `deleteVariantOption.js`**: Ensure `skuIds` source remains trusted (internal DB query).

## 5. Signed-Off
**Auditor Signature:** Antigravity
**Date:** 2026-02-15
