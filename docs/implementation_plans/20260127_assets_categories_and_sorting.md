# Asset Categories and Sorting Implementation Plan

## Goal
Implement a categorization system for Assets to allow Admin to group assets (e.g., "Golf Carts", "Marquees") and control the sort order of both categories and individual assets. This structure will be reflected in the User Store interface.

## User Review Required
> [!IMPORTANT]
> **Database Changes**: This plan requires database schema changes. A SQL script is provided below. You must run this script in SSMS before I can proceed with the code changes.

## Proposed Changes

### Database
#### [NEW] `asset_categories` Table
- `asset_category_id` (PK, Identity)
- `event_id` (FK to Events) - Categories are event-specific to allow for different groupings per event.
- `name` (NVARCHAR)
- `sort_order` (INT)

#### [MODIFY] `asset_types` Table
- Add `asset_category_id` (FK to `asset_categories`, Nullable)
- Add `sort_order` (INT, Default 0)

### SQL Script
Please run the following script on your **Dev** and **Master** databases:

```sql
-- 1. Create Asset Categories Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asset_categories')
BEGIN
    CREATE TABLE asset_categories (
        asset_category_id INT IDENTITY(1,1) PRIMARY KEY,
        event_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(event_id)
    );
    PRINT 'Created table asset_categories';
END

-- 2. Add columns to Asset Types
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('asset_types') AND name = 'asset_category_id')
BEGIN
    ALTER TABLE asset_types ADD asset_category_id INT NULL;
    ALTER TABLE asset_types ADD CONSTRAINT FK_AssetTypes_Categories FOREIGN KEY (asset_category_id) REFERENCES asset_categories(asset_category_id);
    PRINT 'Added asset_category_id to asset_types';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('asset_types') AND name = 'sort_order')
BEGIN
    ALTER TABLE asset_types ADD sort_order INT DEFAULT 0;
    PRINT 'Added sort_order to asset_types';
END
```

### API
#### [MODIFY] `api/src/functions/assets/getAssets.js`
- Update query to join `asset_categories`.
- Select `ac.name as category_name`, `ac.sort_order as category_sort_order`, `at.sort_order`.
- Update `ORDER BY` clause to: `ac.sort_order ASC, at.sort_order ASC, at.name ASC`.

#### [MODIFY] `api/src/functions/assets/manageAssetTypes.js`
- Update `POST` and `PUT` handlers to accept `asset_category_id`. (Sort order handled via reorder endpoint).

#### [NEW] `api/src/functions/assets/manageAssetCategories.js`
- Create CRUD endpoints for `asset_categories`.
- Route: `assets/categories/{id?}`.
- Methods: GET, POST, PUT, DELETE.

#### [NEW] `api/src/functions/assets/reorderAssets.js`
- Two endpoints (or one with mode):
    1.  `PUT assets/categories/reorder`: Accepts list of `{ id, sort_order }`. Updates `asset_categories`.
    2.  `PUT assets/types/reorder`: Accepts list of `{ id, sort_order }`. Updates `asset_types`.

#### [MODIFY] `api/src/functions/getStoreItems.js`
- Update the `assets` fetch query to include category information and sort order.
- Ensure the result set is ordered by Category Sort -> Asset Sort.

### Client (Admin)
#### [NEW] `client/src/pages/admin/assets/AssetCategories.jsx` (Component or Modal)
- **Modal Implementation**:
    - List categories using `@dnd-kit` (SortableContext, verticalListSortingStrategy).
    - Drag-and-drop to reorder.
    - Save order via API `assets/categories/reorder`.
    - Add/Edit/Delete actions.

#### [MODIFY] `client/src/pages/admin/assets/AssetTypes.jsx`
- **Grouped View**:
    - Fetch assets and categories.
    - Group assets by Category.
    - Render a `SortableContext` for *each* category group (or one large context if handling cross-group drag, but per-group is safer for now).
    - Allow dragging to reorder *within* the category.
    - If an asset is "Uncategorized", put it in a default group at the bottom.
- **UI Changes**:
    - Replace the single table with multiple tables (one per category) or a grouped list.
    - Add drag handles to rows.
    - "Manage Categories" button opens the new Modal.
- **Dependencies**: Use `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (already in use in `MerchandiseList.jsx`).

### Client (User Store)
#### [MODIFY] `client/src/pages/StorePage.jsx`
- Update the "Hire Assets" tab rendering logic.
- Group the flat `data.assets` array by `category_name`.
- Render a header for each category (e.g., `<h2>Golf Carts</h2>`).
- Render assets within that category grid.
- Handle "Uncategorized" assets (render them first or last, depending on logic, likely last or under "Other").

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1.  **Database**: Verify columns exist in SSMS.
2.  **Admin - Categories**:
    - Open "Manage Categories" modal.
    - Create "Golf Carts", "Marquees".
    - Drag "Marquees" above "Golf Carts".
    - Save/Close. Re-open to verify order persists.
3.  **Admin - Assets**:
    - Create assets in "Golf Carts".
    - Drag to reorder them.
    - Refresh page to verify order persists.
4.  **Store**:
    - Verify assets appear in the correct Category order.
    - Verify assets within categories appear in the correct sort order.
