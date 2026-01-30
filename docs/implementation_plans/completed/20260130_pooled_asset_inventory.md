# Pooled Asset Inventory Implementation Plan

## Goal
Switch the Asset Hiring system from a "Serialized Inventory" model (where users must book a specific physical item like "Cart #1") to a "Pooled Inventory" model (where users book "A Golf Cart type" and the system checks against a total stock count).

## User Review Required
> [!IMPORTANT]
> **Data Check**: Existing `asset_hires` are linked to specific `asset_items`. The migration script (below) will backfill the `asset_type_id` for these records so they count against the new stock limit. The individual items you created can be deleted later if you wish, or kept for reference.

## Proposed Changes

### Database
#### [MODIFY] `asset_types` table
- Add column `stock_quantity` (INT, NOT NULL, DEFAULT 0).
- This number represents the total available pool for hiring.

#### [MODIFY] `asset_hires` table
- Add column `asset_type_id` (INT, NULL, FK to `asset_types`).
- Alter column `asset_item_id` to allow NULL.
- **Why**: Bookings will now link to the *Type* primarily. Linking to a specific item is optional (e.g. at pickup time).

### SQL Migration Script
You will need to run this script on your database:
```sql
-- 1. Add stock_quantity to asset_types
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('asset_types') AND name = 'stock_quantity')
BEGIN
    ALTER TABLE asset_types ADD stock_quantity INT DEFAULT 0 NOT NULL;
END
GO

-- 2. Add asset_type_id to asset_hires
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('asset_hires') AND name = 'asset_type_id')
BEGIN
    ALTER TABLE asset_hires ADD asset_type_id INT NULL;
    ALTER TABLE asset_hires ADD CONSTRAINT FK_AssetHires_Type FOREIGN KEY (asset_type_id) REFERENCES asset_types(asset_type_id);
END
GO

-- 3. Make asset_item_id nullable (if not already)
ALTER TABLE asset_hires ALTER COLUMN asset_item_id INT NULL;
GO

-- 4. Backfill asset_type_id for existing hires
UPDATE ah
SET ah.asset_type_id = ai.asset_type_id
FROM asset_hires ah
JOIN asset_items ai ON ah.asset_item_id = ai.asset_item_id
WHERE ah.asset_type_id IS NULL;
GO

-- 5. Initialize stock_quantity from existing item count (optional helper)
-- Only runs if stock is 0
UPDATE at
SET at.stock_quantity = (SELECT COUNT(*) FROM asset_items ai WHERE ai.asset_type_id = at.asset_type_id AND ai.status = 'Active')
FROM asset_types at
WHERE at.stock_quantity = 0;
GO

-- 6. [CRITICAL] Migrate order_items to point to asset_type_id instead of asset_item_id
-- We must preserve the link to the specific item in asset_hires first (Step 4 does this).
-- Now we update order_items so the "Invoice" sees the Type (Game Plan), not the specific unit.
UPDATE oi
SET oi.item_reference_id = ai.asset_type_id
FROM order_items oi
JOIN asset_items ai ON oi.item_reference_id = ai.asset_item_id
WHERE oi.item_type = 'Asset';
GO
```

### API
#### [MODIFY] `api/src/functions/assets/getAssetAvailability.js`
- Update logic to count overlaps against `stock_quantity`.

#### [MODIFY] `api/src/functions/createOrder.js`
- **Cart/Invoice Impact**:
    -   Store `asset_type_id` in `order_items.item_reference_id` (instead of `asset_item_id`).
    -   Insert `asset_hires` with correct `asset_type_id` and NULL `asset_item_id`.

#### [MODIFY] `api/src/functions/getOrderDetail.js`
- **Fix Invoice View**:
    -   Update the JOINs for Assets.
    -   Join `asset_types` DIRECTLY on `order_items.item_reference_id = asset_types.asset_type_id`.
    -   Left Join `asset_hires` to get dates.
    -   Left Join `asset_items` ON `asset_hires.asset_item_id` (to optionally show "Assigned Cart #1" if assigned).


#### [MODIFY] `api/src/functions/assets/manageAssetTypes.js`
- Update PUT/POST to accept `stock_quantity`.

### Client (Admin) - Assignment Feature
#### [NEW] `client/src/pages/admin/assets/AssetAssignments.jsx` (Future/Concurrent)
- A view to see all "Pooled" bookings.
- Ability to "Assign" a specific `asset_item_id` (e.g. "Golf Cart #4") to a booking `asset_hire_id`.
- This ensures we **retain the ability to track usage** while simplifying the **booking** process.

### Client (Admin) - Asset Types
#### [MODIFY] `client/src/pages/admin/assets/AssetTypes.jsx`
- Add "Stock" column to the table.
- Add "Quantity" input to the Add/Edit form.

### Client (Store)
#### [MODIFY] `client/src/components/AssetSelectionModal.jsx`
- Remove the list of individual item cards ("Select Cart #1").
- Show the Asset Type details and a simple "Add to Cart" button.
- Display "Available: X" (calculated from API).

#### [MODIFY] `client/src/pages/StorePage.jsx`
- Simplify `handleAddAssetToCart` to handle the generic asset object (no specific ID).

## Verification Plan

### Test Scenarios
1.  **Database Migration**: Run the SQL script on Dev DB. Verify `asset_hires` are updated.
2.  **Admin**:
    -   Edit "Golf Cart" type. Set Stock to 2.
    -   Verify stock persists.
3.  **Booking Flow**:
    -   User A books Golf Cart (Jan 1-3). Order succeeds.
    -   User B books Golf Cart (Jan 1-3). Order succeeds.
    -   User C attempts booking (Jan 1-3). Should fail (Stock limit 2 reached).
    -   User C attempts booking (Jan 4-5). Should succeed.
4.  **Legacy Check**:
    -   Ensure old bookings (made against specific items) still show up in reports (admin side).
5.  **Assignment Logic**:
    -   (Manual DB Check) Verify we can update an `asset_hire` record to link a specific `asset_item_id` later.
