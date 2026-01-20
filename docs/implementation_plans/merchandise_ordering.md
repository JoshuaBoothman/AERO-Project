# Merchandise Sorting Implementation Plan

## Goal Description
Allow the admin to control the display order of merchandise products in the public store. Currently, they likely appear in database ID order. The client requests a specific "predefined order", ideally via drag-and-drop or a numbering system.

## User Review Required
> [!NOTE]
> **Schema Change**: This requires adding a `sort_order` column to the `products` table.
> A SQL script will be provided.

## Proposed Changes

### Database Schema
#### [NEW] [docs/updates/product_sort_order.sql](file:///c:/laragon/www/AERO-Project/docs/updates/product_sort_order.sql)
- **Table `products`**:
    - Add `sort_order` (INT, Default 0 or 999).

### API (`api/src`)
#### [MODIFY] [functions/getStoreItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getStoreItems.js)
- Update the SQL query to `ORDER BY p.sort_order ASC, p.name ASC`.

#### [MODIFY] [functions/manageProducts.js](file:///c:/laragon/www/AERO-Project/api/src/functions/manageProducts.js)
- **Update**: Allow `sort_order` to be passed in the PUT/POST body.
- **New Action**: (Optional) specific endpoint for bulk reorder if we implement Drag-and-Drop, or just reuse the Update endpoint per item.
    - *Decision*: A bulk update endpoint `reorderProducts` (PUT /api/manage/products/reorder) is most efficient for Drag-and-Drop.
    - Loop through array of `{ id, sort_order }` and execute updates.

### Frontend (`client/src`)
#### [MODIFY] [pages/admin/ProductEditor.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/ProductEditor.jsx)
- **UI**: Add a "Sort Order" column (Input type number) OR implement Drag-and-Drop rows.
- **Drag-and-Drop**:
    - Use `dnd-kit` or `react-beautiful-dnd` (or native HTML5 drag and drop if simple).
    - If library is too heavy, a simple "Move Up / Move Down" or number input is sufficient as a fallback.
    - *Plan*: Start with Number Input for MVP. If easy, add Drag-and-Drop.

## Verification Plan

### Manual Verification
1.  **Schema**: Run SQL update.
2.  **Admin**:
    - Edit Product A -> Set Sort Order 1.
    - Edit Product B -> Set Sort Order 2.
    - Support "Bulk Save" or "Auto Save" on change?
3.  **Storefront**:
    - Refresh Store Page.
    - Verify A appears before B.
    - Change Order (B=1, A=2).
    - Verify B appears before A.
