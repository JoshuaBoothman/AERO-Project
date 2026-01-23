# Implementation Plan - Subevent Variations Admin UI

The user requested an Admin UI to manage Subevent Variations (e.g., "Cook Time", "Sides") instead of running SQL scripts. This will be integrated into the existing `AdminSubevents` page.

## User Review Required
> [!NOTE]
> This replaces the need for the `seed_test_variations.sql` script. We will verify the feature by creating variations via the UI.

## Proposed Changes

### Backend (API)
#### [NEW] [manageSubeventVariations.js](file:///c:/laragon/www/AERO-Project/api/src/functions/manageSubeventVariations.js)
New Azure Function to handle CRUD operations for variations:
- `GET /api/subevents/{id}/variations`: List all variations and options.
- `POST /api/subevents/{id}/variations`: Create a new variation category.
- `DELETE /api/variations/{id}`: Delete a variation category (Cascade delete options).
- `POST /api/variations/{id}/options`: Add an option to a category.
- `DELETE /api/variation-options/{id}`: Remove an option.

### Frontend (Client)
#### [NEW] [SubeventVariationManager.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/admin/SubeventVariationManager.jsx)
A modal component to manage options for a specific subevent.
- Lists existing variations.
- Form to add new variations (e.g. "Steak Cook").
- UI to add options to variations (e.g. "Rare", "Medium") with Price Adjustments.

#### [MODIFY] [AdminSubevents.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminSubevents.jsx)
- Add "Variations" button to the subevents table.
- Integrate `SubeventVariationManager` modal.

## Verification Plan
### Manual Verification
1. Open Admin > Subevents.
2. Select "Steak Night" (or create it).
3. Click "Variations".
4. Add "Cook Time" (Required).
5. Add Options: "Rare", "Medium", "Well Done".
6. Add "Sauce" (Optional).
7. Add Options: "Mushroom (+$2.50)".
8. Go to Store Page and verify these options appear and work in the cart.
