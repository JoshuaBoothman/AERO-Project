# Merchandise Sorting Implementation Plan

## Goal Description
Allow the admin to control the display order of merchandise products in the public store via a **Drag-and-Drop interface**.

## User Review Required
> [!NOTE]
> **Schema Change**: This requires adding a `sort_order` column to the `products` table.
> **Dependency**: Will install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` for the frontend.

## Proposed Changes

### Database Schema
#### [NEW] [docs/updates/product_sort_order.sql](file:///c:/laragon/www/AERO-Project/docs/updates/product_sort_order.sql)
- **Table `products`**:
    - Add `sort_order` (INT, Default 0).

### API (`api/src`)
#### [MODIFY] [functions/getStoreItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getStoreItems.js)
- Update the SQL query to `ORDER BY p.sort_order ASC, p.name ASC`.

#### [MODIFY] [functions/manageProducts.js](file:///c:/laragon/www/AERO-Project/api/src/functions/manageProducts.js)
- **New Endpoint**: `PUT /api/manage/products/reorder`
    - Accepts: `items` (Array of `{ id, sort_order }`).
    - Logic: Loop through the array and update `sort_order` for each product ID.

### Frontend (`client/src`)
#### [MODIFY] [pages/admin/ProductEditor.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/ProductEditor.jsx)
- **Install Dependencies**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- **UI Logic**:
    - Wrap the product list/table in `DndContext` and `SortableContext`.
    - Create a `SortableRow` component for the table rows.
    - Implement `onDragEnd` handler:
        - Reorder local state immediately for UI feedback.
        - Send API request to `PUT /api/manage/products/reorder` to persist changes.

## Verification Plan

### Manual Verification
1.  **Schema**: Run SQL update.
2.  **Admin UI**:
    - Verify list renders.
    - Drag "Product A" (top) to the bottom.
    - Verify it stays in new position.
    - Reload page -> Verify position persists.
3.  **Storefront**:
    - Refresh Store Page.
    - Verify products appear in the specific custom order set in Admin.
