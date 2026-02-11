# Asset Hire Options (Dropdown per Asset Type)

**Date**: 2026-02-11
**Status**: Planning

## Goal

Allow admins to define optional dropdown choices for each asset type (e.g. "Bitumen Line", "Grass Line" for Marquees). When a user hires an asset that has options configured, they must select one from a dropdown before adding it to their cart. When an asset type has no options, no dropdown is shown.

---

## User Review Required

> [!IMPORTANT]
> **Database change required.** You will need to run the SQL script below in SSMS before implementation can begin.

> [!NOTE]
> **Dropdown label:** Admin can customise the label per asset type (e.g. "Flight Line", "Colour"). Defaults to "Option" if not set.
>
> **Selection is mandatory** when options exist. If an opt-out is needed, admin adds a "None" or "N/A" option.

---

## Logic Explanation

### Data Model

A new table `asset_type_options` stores the predefined choices for each asset type. Each row is one selectable option (e.g. "Bitumen Line"). The `asset_types` table gets an optional `option_label` column so admins can customise the dropdown heading (e.g. "Flight Line" instead of the default "Option").

When an option is selected during checkout, its ID is stored on the `asset_hires` row so we know which option the hirer chose.

**Key relationships:**

```
asset_types (1) ───→ (many) asset_type_options
asset_hires.selected_option_id ───→ asset_type_options.asset_type_option_id
```

### Conditional Display Logic

The dropdown is shown **only when options exist** for the asset type. The logic is simple:

1. When `getAssets` returns asset types, it will include the count of options (`option_count`) and the `option_label`.
2. `AssetSelectionModal` checks: if `asset.option_count > 0`, render the dropdown.
3. If `option_count === 0`, no dropdown — the flow is unchanged.
4. When the user clicks "Add to Cart", the selected option ID is included in the cart item data.
5. `createOrder.js` stores the `selected_option_id` on the `asset_hires` row.
6. `getAssetHires.js` joins to `asset_type_options` to display the selected option name in the admin hires list.

### Admin Configuration Flow

1. Admin opens an asset type in the **Asset Types** page and clicks "Edit".
2. The edit modal now has a new section: **"Hire Options"**.
3. Admin can set the **Option Label** (e.g. "Flight Line") — optional, defaults to "Option".
4. Admin can add/remove option values (e.g. "Bitumen Line", "Grass Line").
5. Options are managed via inline inputs with add/delete buttons (no separate page needed).

---

## Proposed SQL Script

Run this in SSMS **before** implementation begins:

```sql
-- ============================================================
-- Asset Hire Options - Schema Changes
-- Date: 2026-02-11
-- ============================================================

-- 1. Create the options lookup table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'asset_type_options')
BEGIN
    CREATE TABLE asset_type_options (
        asset_type_option_id INT IDENTITY(1,1) PRIMARY KEY,
        asset_type_id        INT NOT NULL,
        label                NVARCHAR(100) NOT NULL,
        sort_order           INT NOT NULL DEFAULT 0,
        is_active            BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_asset_type_options_type
            FOREIGN KEY (asset_type_id) REFERENCES asset_types(asset_type_id)
            ON DELETE CASCADE
    );
END
GO

-- 2. Add option_label column to asset_types (admin-controlled dropdown heading)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'asset_types' AND COLUMN_NAME = 'option_label'
)
BEGIN
    ALTER TABLE asset_types
    ADD option_label NVARCHAR(50) NULL;
END
GO

-- 3. Add selected_option_id to asset_hires (stores the hirer's choice)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'asset_hires' AND COLUMN_NAME = 'selected_option_id'
)
BEGIN
    ALTER TABLE asset_hires
    ADD selected_option_id INT NULL;

    ALTER TABLE asset_hires
    ADD CONSTRAINT FK_asset_hires_option
        FOREIGN KEY (selected_option_id) REFERENCES asset_type_options(asset_type_option_id);
END
GO
```

---

## Proposed Changes

### Backend (API)

---

#### [NEW] [manageAssetTypeOptions.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/manageAssetTypeOptions.js)

New Azure Function for CRUD on `asset_type_options`.

- **Route**: `assets/types/{typeId}/options/{id?}`
- **GET**: Returns all active options for a given `typeId`, ordered by `sort_order`.
- **POST**: Creates a new option `{ label }` for the given `typeId`.
- **PUT**: Updates an option's `label` or `sort_order`.
- **DELETE**: Hard-deletes an option if it has no hires referencing it; otherwise soft-deletes (`is_active = 0`).

---

#### [MODIFY] [getAssets.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/getAssets.js)

Add a subquery to include `option_count` and `option_label` in the asset types response:

```diff
 SELECT
     at.asset_type_id,
     at.name,
     ...
     at.stock_quantity,
     at.sort_order,
+    at.option_label,
+    (SELECT COUNT(*) FROM asset_type_options ato WHERE ato.asset_type_id = at.asset_type_id AND ato.is_active = 1) as option_count,
     ac.name as category_name,
```

---

#### [MODIFY] [manageAssetTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/manageAssetTypes.js)

- **POST**: Accept and store `option_label`.
- **PUT**: Accept and update `option_label`.

---

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)

In the asset processing section (Section 6, ~line 662):

- Accept `selectedOptionId` from the `asset` payload.
- If the asset type has options configured (`option_count > 0`), **validate** that `selectedOptionId` is provided and belongs to the correct `asset_type_id`.
- Insert `selected_option_id` into the `asset_hires` `INSERT` statement.

```diff
 .query(`INSERT INTO asset_hires (asset_type_id, asset_item_id, order_item_id, hire_start_date, hire_end_date)
-    VALUES (@atid, NULL, @oiid, @start, @end)`);
+    INSERT INTO asset_hires (asset_type_id, asset_item_id, order_item_id, hire_start_date, hire_end_date, selected_option_id)
+    VALUES (@atid, NULL, @oiid, @start, @end, @optId)`);
```

---

#### [MODIFY] [getAssetHires.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assets/getAssetHires.js)

Join to `asset_type_options` to include the selected option name in the hires list:

```diff
 SELECT
     ah.asset_hire_id,
     ah.hire_start_date,
     ah.hire_end_date,
+    ato.label as selected_option_label,
     ...
 FROM asset_hires ah
+LEFT JOIN asset_type_options ato ON ah.selected_option_id = ato.asset_type_option_id
```

---

### Frontend (Client)

---

#### [MODIFY] [AssetTypes.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/assets/AssetTypes.jsx)

**Admin edit modal changes:**

1. Add `option_label` field to the form (text input, placeholder "e.g. Flight Line").
2. Add a new **"Hire Options"** section below the image section:
   - Fetches options from `GET /api/assets/types/{typeId}/options` when in edit mode.
   - Displays existing options as a list of inline inputs with a delete button.
   - Has an "Add Option" button that appends a new empty input.
   - On save, sends individual POST/PUT/DELETE calls for changed options.
3. Show an indicator on the asset type card (e.g. pill badge "3 Options") when options exist.

**Proposed UI (Edit Modal — new section):**

```
┌─────────────────────────────────────────────┐
│  Hire Options                               │
│                                             │
│  Dropdown Label: [ Flight Line          ]   │
│                                             │
│  Options:                                   │
│  ┌─────────────────────────────────┐        │
│  │ Bitumen Line              [🗑️] │        │
│  │ Grass Line                [🗑️] │        │
│  └─────────────────────────────────┘        │
│  [ + Add Option ]                           │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### [MODIFY] [AssetSelectionModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AssetSelectionModal.jsx)

**User-facing hire modal changes:**

1. Accept `options` and `option_label` from the `asset` prop (passed through from `StorePage`).
2. If `asset.option_count > 0`, fetch options from `GET /api/assets/types/{typeId}/options`.
3. Render a `<select>` dropdown between the header and the availability section:
   - Label: `asset.option_label || "Option"`.
   - Options: Mapped from fetched data.
   - **"Add to Cart" button is disabled until an option is selected.** Selection is always mandatory when options exist (admin can add "None" as an option if opt-out is needed).
4. Pass `selectedOptionId` through the `handleSelect` callback to the parent.
5. If `asset.option_count === 0`, no dropdown — unchanged flow.

**Proposed UI (Hire Modal — with dropdown):**

```
┌──────────────────────────────────────────────┐
│  Marquee                                     │
│  [Daily Hire] [Full Event Pkg]               │
│  12/02/2026 - 18/02/2026 | 7 Days = $350    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Flight Line                         │    │
│  │ ┌──────────────────────────────┐    │    │
│  │ │ Select a flight line...    ▼ │    │    │
│  │ └──────────────────────────────┘    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  5 available for your dates.                 │
│                                              │
│  [ Add to Cart for $350 ]  ← disabled until  │
│                               option selected │
└──────────────────────────────────────────────┘
```

---

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)

- Pass `option_count` and `option_label` through the `asset` object to `AssetSelectionModal`.
- In `handleAddAssetToCart`: include `selectedOptionId` in the cart item payload.

---

#### [MODIFY] [Checkout.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Checkout.jsx)

- Include `selectedOptionId` in the `assets` array sent to `createOrder`.
- Display the selected option label in the order summary line item (e.g. "Marquee — Bitumen Line").

---

#### [MODIFY] [AssetHires.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/assets/AssetHires.jsx)

- Display `selected_option_label` in the hires table (new column or subtitle under asset name).

---

## Verification Plan

### Manual Verification (Admin Side)

1. **Create options**: Go to Admin → Assets → Asset Types → Edit a type (e.g. "Marquee"). Add 2-3 options (e.g. "Bitumen Line", "Grass Line"). Set the dropdown label to "Flight Line". Save.
2. **Verify persistence**: Close the modal and re-open it. Confirm options are still there.
3. **Delete an option**: Remove one option. Verify it disappears on re-open.
4. **No-options asset**: Edit a different asset type and confirm no options section exists (or exists but is empty with "Add Option" button).

### Manual Verification (User/Store Side)

5. **Dropdown appears**: Navigate to the Store page. Click on the asset type that has options. Verify the dropdown appears with the correct label and choices.
6. **Add to Cart blocked**: Confirm the "Add to Cart" button is disabled until an option is selected.
7. **Add to Cart works**: Select an option, click "Add to Cart". Verify the cart displays the asset name with the selected option (e.g. "Marquee — Bitumen Line").
8. **No-dropdown asset**: Click on an asset type with NO options. Verify no dropdown appears and the existing flow works normally.
9. **Checkout**: Complete a purchase with the option-bearing asset. Verify the `asset_hires` row in the database has the correct `selected_option_id`.
10. **Admin hires list**: Go to Admin → Assets → Hires. Verify the selected option label is displayed for the hire.
