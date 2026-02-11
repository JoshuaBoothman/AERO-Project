# Fix Asset Hires List and Add Filters

## Goal
Fix the row duplication in the "Hires" list caused by users with multiple person profiles, and add search/status filter functionality to the admin interface.

## Proposed Changes

### API Changes

#### [MODIFY] [getAssetHires.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/getAssetHires.js)
Deduplicate hirer names by using `OUTER APPLY` to select only the first associated person record for the order's user. This prevents row duplication when a user has multiple person profiles (e.g., guests or crew).

```diff
-        LEFT JOIN persons p ON o.user_id = p.user_id
+        OUTER APPLY (
+            SELECT TOP 1 first_name, last_name 
+            FROM persons 
+            WHERE user_id = o.user_id
+            ORDER BY person_id ASC
+        ) p
```

### Frontend Changes

#### [MODIFY] [AssetHires.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/assets/AssetHires.jsx)
Implement search and status filtering for the hires list.

```javascript
const filteredHires = hires.filter(hire => {
    const matchesSearch = 
        hire.asset_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hire.hirer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hire.order_id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !hire.returned_at) ||
        (statusFilter === 'returned' && hire.returned_at);

    return matchesSearch && matchesStatus;
});
```

## Verification Plan

### Manual Verification
1.  **Deduplication:** Navigate to the "Hires" tab in Admin. Verify that Order #120 now shows as a single row.
2.  **Search:** Type "Marquee" or "Josh" in the search box. Verify the list filters correctly.
3.  **Status Filter:** Toggle between "All", "Active", and "Returned". Verify the list updates accordingly.
