# IMPLEMENTATION PLAN: Delete Existing Asset Inventory

## Goal
Enable admin users to delete inventory items in asset management, even if they have associated hire records.

## Problem
Currently, the system blocks deletion of `asset_items` if there are any records in `asset_hires` referencing them. This prevents admins from cleaning up old or broken stock that has been used in the past.

## Proposed Logic
We will implement "Soft Delete" logic for items with history, and "Hard Delete" for unused items.

1.  **Check for History**: When a delete request is received (`DELETE /api/assets/items/{id}`), the system will check `asset_hires` for any records linked to this `asset_item_id`.
2.  **Soft Delete (Archive)**: If hire history exists:
    *   Update the `status` column of the `asset_item` to `'Deleted'`.
    *   This preserves the data integrity for historical reporting but marks the item as removed.
3.  **Hard Delete**: If **no** hire history exists:
    *   Permanently delete the record from `asset_items` (existing behavior).
4.  **Read Filtering**:
    *   Update the `GET` endpoint to filter out items where `status = 'Deleted'` by default, so they disappear from the admin interface.

## Database Changes
No schema changes are required. The `status` column in `asset_items` is `varchar(20)` and can accommodate the value `'Deleted'`.

### SQL Script (For Validation/Manual Updates)
Run this script to inspect items or manually mark them as deleted if needed before the code change:

```sql
-- Check for items that would be candidates for soft delete
SELECT i.asset_item_id, i.identifier, i.status, COUNT(h.asset_hire_id) as hire_count
FROM asset_items i
LEFT JOIN asset_hires h ON i.asset_item_id = h.asset_item_id
GROUP BY i.asset_item_id, i.identifier, i.status
HAVING COUNT(h.asset_hire_id) > 0;

-- Example: Manually Mark an item as Deleted
-- UPDATE asset_items SET status = 'Deleted' WHERE asset_item_id = [ID];
```

## Interface Changes
The frontend interface will remain largely the same visually, but the *behavior* of the Delete action will change.

### Proposed New Interface Behavior
1.  **Asset Management List**:
    *   The "Delete" button (trash icon) will no longer show an error message when clicked for used items.
    *   **Confirmation Dialog**: When the user clicks Delete, a confirmation dialog will appear.
        *   *Scenario A (Unused Item)*: "Are you sure you want to permanently delete this item?"
        *   *Scenario B (Used Item)*: "This item has hire history. It will be archived and removed from availability, but historical records will be kept. Continue?"
        *   *Note*: The frontend might just show a generic "Are you sure?" message if the backend handles the distinction transparently. For a better UX, the backend can return a specific message or warning code, but for this iteration, a standard confirmation is sufficient as the end result (item removed from list) is the same for the user.

## Proposed Changes

### [API] Asset Management
#### [MODIFY] [manageAssetItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/manageAssetItems.js)
- Update `DELETE` handler:
    - Query `asset_hires` count.
    - If count > 0 -> `UPDATE asset_items SET status = 'Deleted' WHERE asset_item_id = @id`.
    - Else -> `DELETE FROM asset_items WHERE asset_item_id = @id`.
- Update `GET` handler:
    - Add `AND status != 'Deleted'` to the SQL query.

## Verification Plan

### Automated Test
Create a script `scripts/test_asset_deletion_logic.js` to verify the logic:
1.  **Setup**: Create `Asset Type X`.
2.  **Test Case 1 (Hard Delete)**:
    - Create `Item A` under `Type X`.
    - Delete `Item A`.
    - **Verify**: `Item A` is completely removed from `asset_items`.
3.  **Test Case 2 (Soft Delete)**:
    - Create `Item B` under `Type X`.
    - Create a mock hire record for `Item B` in `asset_hires`.
    - Delete `Item B`.
    - **Verify**: `Item B` still exists in `asset_items` but `status` is `'Deleted'`.
    - **Verify**: `Item B` is NOT returned by the `GET` API (filtering works).

### Manual Verification
1.  Open the Admin Dashboard -> Asset Management.
2.  Find an item with known hire history (or hire one in the Store first).
3.  Click **Delete**.
4.  Confirm the item disappears from the list.
5.  Check the database (`SELECT * FROM asset_items WHERE status = 'Deleted'`) to confirm it was soft-deleted.
