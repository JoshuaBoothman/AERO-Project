# Campsite Sorting and Bulk Create Update Walkthrough

I have successfully updated the application to enforce numerical sorting for campsites and improved the Bulk Create tool to be smarter about site numbering.

## Changes Implemented

### 1. Database Sorting Logic
- **Constraint**: `site_sort_index` column added (via manual SQL script).
- **Effect**: Sites like "1, 2, 10, 44, 44A" now sort naturally (1, 2, 10, 44, 44A) instead of passing 10 before 2.

### 2. API Updates
- **`getCampsites`**:
  - Now sorts results by `site_sort_index ASC, site_number ASC`.
  - Calculates and returns `next_site_number` (based on the highest existing index + 1).
- **`createCampsites`**:
  - Replaced simple `COUNT` logic with a smart `MAX(index)` check.
  - Accepts a `start_number` override from the client.
  - Default prefix set to empty (was "Site ").

### 3. Frontend Updates (`AdminMapTool.jsx`)
- **Start Number Input**: Added a new "Start #" field in the Bulk Create section.
  - **Auto-Fill**: Automatically pre-filled with the likely next number (e.g., if you have sites 1-10, it suggests 11).
  - **Override**: You can manually change this to fill gaps or handle custom sections.
- **Prefix**: Kept the optional Prefix field but it is no longer required for basic numbering.

## Verification Steps

### 1. Sorting Check
1. Open the **Admin Map Tool**.
2. Select a campground that has mixed site numbers (e.g., create "1", "2", "10", "4A").
3. **Verify**: The list of sites in the sidebar should be sorted as: 1, 2, 4A, 10. (Previously 1, 10, 2, 4A).

### 2. Bulk Create - Auto Sequence
1. Select a campground with sites 1-10.
2. Look at the "Start #" input in the Bulk Create box.
3. **Verify**: It should show "11".
4. Enter Qty: 5. Leave Prefix empty. Click "Add Sites".
5. **Verify**: Sites 11, 12, 13, 14, 15 are created.

### 3. Bulk Create - Manual Override
1. In the same campground (sites 1-15 exist).
2. Look at "Start #". It should show "16".
3. Change "Start #" to **100**.
4. Enter Qty: 2. Click "Add Sites".
5. **Verify**: Sites 100, 101 are created. (Not 16, 17).

### 4. Bulk Create - With Prefix
1. Change "Start #" to **1**.
2. Enter Prefix **"P"**. Qty: 2.
3. Click "Add Sites".
4. **Verify**: Sites P1, P2 are created.
5. **Verify**: Sorting places P1, P2 at the start or end depending on how the database handles 'P' (Should yield index 0, so likely at the top).

## Rollback Plan
If you encounter critical issues, you can revert the code changes using git. The database column `site_sort_index` is a computed column and does not need to be dropped immediately as it doesn't affect legacy logic, but you can drop it with:
```sql
ALTER TABLE campsites DROP COLUMN site_sort_index;
```
