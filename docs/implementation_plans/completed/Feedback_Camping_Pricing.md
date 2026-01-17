# Camping Pricing - Full Event Duration

## Goal
Allow campers to pay a set "Full Event Price" instead of a daily rate, with smart auto-detection when their selected dates match or exceed the event duration.

## User Review Required
> [!IMPORTANT]
> **Schema Changes**:
> The user has been provided the SQL to apply these changes.
> *   Table: `campsites`
>     *   Column: `full_event_price` (DECIMAL(10, 2) NULL)

## Proposed Changes

### Database
*   **Schema**: Add `full_event_price` to `campsites` table.
*   **Data**: Existing sites will need this value populated (default to NULL or 0 if not applicable).

### API
#### [MODIFY] [createCampsites.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createCampsites.js)
*   Accept `full_event_price` in the body.
*   Insert into database.

#### [MODIFY] [updateCampsite.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateCampsite.js)
*   Allow updating `full_event_price`.

#### [MODIFY] [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js)
*   Return `full_event_price` in the response for each site.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Price Logic**: Validating the total price from the frontend.
    *   If `is_full_event` (or derived from dates) is true, use `full_event_price`.
    *   Else use `daily_price * nights`.

### Frontend
#### [MODIFY] [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx) (or similar)
*   **Price Display**: Show "Daily: $X" AND "Full Event: $Y".
*   **Selection Logic**:
    *   Allow User to select "Full Event" option directly (Checkbox or Button).
    *   **Smart Detection**:
        *   If User selects Date Range that equals or covers the full event dates (needs Event Start/End dates passed to component):
        *   Auto-select "Full Event" mode.
        *   Update displayed Total Cost to `full_event_price`.
*   **Cart/Booking**: Pass `price_applied` or `is_full_event` flag to checkout to ensure correct calculation.

#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)
*   **Add/Edit Site**:
    *   Add Input for "Full Event Price".

## Verification Plan
1.  **Admin Setup**:
    *   Edit a campsite, set Daily = $20, Full Event = $80 (assuming 5 days, so $20 discount).
2.  **Booking Flow - Manual full Event**:
    *   Open Site. Select "Full Event" option.
    *   Verify Price is $80.
3.  **Booking Flow - Smart Detect**:
    *   Select Dates: Day 1 to Day 5.
    *   Verify System switches to "Full Event Price" ($80) instead of Daily ($100).
4.  **Booking Flow - Partial**:
    *   Select Dates: Day 1 to Day 3.
    *   Verify Price is Daily ($20 * 3 = $60).
