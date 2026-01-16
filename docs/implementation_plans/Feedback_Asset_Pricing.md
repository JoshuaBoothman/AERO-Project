# Asset Pricing Options Implementation

## User Review Required
> [!IMPORTANT]
> **User Action Required:** Run the following SQL commands on **BOTH** Dev and Live databases.

```sql
ALTER TABLE asset_types ADD full_event_cost DECIMAL(10, 2) NULL;
ALTER TABLE asset_types ADD show_daily_cost BIT DEFAULT 1;
ALTER TABLE asset_types ADD show_full_event_cost BIT DEFAULT 0;
```

## Proposed Changes

### Frontend
#### [MODIFY] [AssetTypeForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AssetTypeForm.jsx)
*   Add inputs for `full_event_cost`.
*   Add Checkboxes for "Enable Daily Cost" and "Enable Full Event Cost".
*   Validation: Ensure at least one pricing option is enabled.

#### [MODIFY] [AssetSelectionModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/AssetSelectionModal.jsx)
*   **Pricing Logic Update**:
    *   If **Daily Only**: Current behavior (Date Picker, Daily Rate).
    *   If **Full Event Only**: Hide Date Picker (force Event Dates), show "Full Event Price".
    *   If **Both**: Allow user to choose "Daily Hire" or "Full Event Package".
    *   Display correct price based on selection.

### API
#### [MODIFY] [assetTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/assetTypes.js)
*   Update `createAssetType` and `updateAssetType` to handle new fields.
*   Update `getAssetTypes` query (likely already `SELECT *`).

#### [MODIFY] [getAssetAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getAssetAvailability.js)
*   Ensure generic availability check handles "Full Event" (uses Event Start/End as dates).

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Validation**: If item Type is Asset, validation relies on frontend-sent price currently. (Keeping this as-is for now, relying on dates).
*   If "Full Event" was chosen, `checkIn` and `checkOut` should match Event Dates.

## Verification Plan
1.  **DB**: Run SQL scripts.
2.  **Admin**:
    *   Edit "Golf Cart".
    *   Set Daily Cost: $50, Enable Daily: YES.
    *   Set Full Event Cost: $200, Enable Full: YES.
    *   Save.
3.  **User**:
    *   Open "Hire Assets".
    *   Select "Golf Cart".
    *   See Toggle: "Daily ($50/day)" vs "Full Event ($200)".
    *   Select Full Event -> Verify Dates lock to Event Dates, Price is $200.
    *   Select Daily -> Verify Date Picker works, Price = $50 * Days.
