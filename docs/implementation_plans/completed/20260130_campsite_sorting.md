# Campsite Sorting and Bulk Create Update

## Goal Description
The goal is to ensure that campsites are sorted numerically (e.g., 1, 2, 10, 44, 44A, 45) rather than alphanumerically (which would put 10 before 2), and to simplify the "Bulk Create" interface by removing the manual prefix option while improving the logic to automatically determine the next available site number.

## User Review Required
> [!IMPORTANT]
> **Manual Database Change Required**
> A SQL script is provided below to add a computed column `site_sort_index` to the `campsites` table. This column will automatically parse the numeric part of the site number (e.g., "44A" -> 44) to enable efficient sorting and logic. Please run this script in SSMS before approving the plan.

### Proposed SQL Script
```sql
-- Add a computed column to extract the leading number from site_number for sorting
-- Logic: Finds the index of the first non-numeric character, takes the substring before it, and casts to INT.
-- Handles empty strings and starts-with-letter cases gracefully.

ALTER TABLE campsites 
ADD site_sort_index AS CAST(
    CASE 
        WHEN site_number IS NULL OR site_number = '' THEN 0
        WHEN PATINDEX('%[^0-9]%', site_number) = 0 THEN site_number -- All numbers
        WHEN PATINDEX('%[^0-9]%', site_number) = 1 THEN '0'         -- Starts with non-number (e.g. 'A1')
        ELSE LEFT(site_number, PATINDEX('%[^0-9]%', site_number) - 1) 
    END AS INT
) PERSISTED;

-- Optional: Create an index for performance
CREATE INDEX IX_Campsites_SortIndex ON campsites(site_sort_index, site_number);
```

## Proposed Changes

### Database Layer
- **[MANUAL]** Run the SQL script above to add `site_sort_index`.

### API
#### [MODIFY] [getCampsites.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampsites.js)
- Update the SQL query to `ORDER BY site_sort_index ASC, site_number ASC`.
- **New Feature**: Calculate and return `next_site_number` (MAX(site_sort_index) + 1) in the JSON response. This allows the UI to suggest the correct starting number for bulk creation.

#### [MODIFY] [createCampsites.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createCampsites.js)
- Update "Bulk Create" logic:
  - Accept an optional `start_number` from the request.
  - If `start_number` is provided, use it as the starting point for the sequence.
  - If NOT provided, fall back to `MAX(site_sort_index) + 1` (DB lookup).
  - **Retain Prefix**: Allow `prefix` to be passed. The site name will be generated as `${prefix}${current_number}`.
  - This supports both "1, 2, 3" (empty prefix) and "P1, P2, P3" (prefix "P") while allowing the user to control the starting number to avoid gaps or collisions.

### Frontend
#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)
- **Bulk Create Section**:
  - **Keep** "Prefix (Opt)" input.
  - **Add** "Start Number" input.
    - Default value: Pre-fill with `next_site_number` fetched from the API (via `fetchCampgroundData`).
    - Allow user to manually edit this if they want to skip a range or if the auto-detected MAX is an outlier.
  - Update `handleBulkAdd` to send `qty`, `prefix`, and `start_number` to the backend.

## Verification Plan

### Manual Verification
1. **Run SQL Script**: Confirm the column `site_sort_index` is created and populated correctly (View data: "44A" should calculate to 44).
2. **View Map Tool**: Open Admin Map Tool.
   - Verify existing sites are sorted correctly in the list (1, 2, ... 10, ... 44, 44A, 45).
3. **Bulk Create**:
   - create 5 sites.
   - Verify they pick up from the highest existing number (e.g. if 45 exists, create 46-50).
4. **Single Create**:
   - Create "100A".
   - Verify it appears in the correct sort position (after 100, before 101).
