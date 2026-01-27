# Cart and Invoice Updates

## Goal
Fix duplicate ticket display on invoices and enhance Cart/Invoice UI to show detailed information for all item types, including Merchandise variants (Size/Color), Campsite details (Site #, Dates), Subevent choices, Asset identifiers, and Pilot names for Pit Crew tickets.

## User Review Required
> [!NOTE]
> No database schema changes are required. The changes are purely in the SQL retrieval logic (`getOrderDetail.js`) and Frontend display (`Invoice.jsx`).

> [!IMPORTANT]
> **Scope Expansion Required**: This plan should be implemented AFTER the following plans to ensure all new metadata types are included:
> - [Day Pass Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) - Adds arrival/departure dates to tickets
> - [Pit Crew Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) - Shares Day Pass logic
> - [Official Dinner Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_official_dinner_registrations.md) - Adds dinner indicator
> - [Subevent Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_subevent_registrations.md) - Adds guest names
>
> Update the backend query and frontend display to handle:
> - Ticket dates for Day Pass tickets
> - "Includes Official Dinner" indicator
> - Guest names for subevents (when `attendee_id` is NULL)

## Proposed Changes

### Frontend
#### [MODIFY] client/src/pages/Invoice.jsx
- Update the item rendering loop to show specific details based on `item.item_type`:
    - **Merchandise**: Show `item.variant_string` (e.g., "Size: L, Color: Red").
    - **Campsite**: Show `item.item_name` (already includes Site #), plus `check_in_date` - `check_out_date`.
    - **Subevent**: Show `item.variant_string` (e.g., "Lunch Choice: Vegan").
    - **Asset**: Show `item.asset_identifier` (e.g., "GOLF-001").
    - **Pit Crew**: Show `item.pilot_name` (Name of the pilot they are crewing for).

#### [MODIFY] client/src/context/CartContext.jsx (or relevant Cart component)
- Ensure the Cart UI rendering mirrors the details shown in the Invoice.

### Backend
#### [MODIFY] api/src/functions/getOrderDetail.js
- **Prevent Duplicates**: Add `DISTINCT` to the main query or refine usage of `LEFT JOIN` to ensure 1:1 row references.
    - *Investigation*: The current query logic appears sound, but `LEFT JOIN` on multiple optional tables can cause fan-out if data integrity is slightly off (e.g. orphan records). The fix will involve being more strict in JOIN conditions and potentially grouping if needed.
- **Fetch Missing Details**:
    - **Merchandise Variants**: Add a `CROSS APPLY` or Subquery to fetch `STRING_AGG` of `variant_categories.name + ': ' + variant_options.value`.
    - **Subevent Variants**: Add a Subquery to fetch `STRING_AGG` of `subevent_variation_options.name` from `subevent_registration_choices`.
    - **Asset Identifier**: Ensure `ai.identifier` is selected (already present).
    - **Pilot Name**: Select `a.pilot_name` AND resolve `linked_pilot_attendee_id` to a name if `pilot_name` is null.

## Verification Plan
### Automated Tests
- None.

### Manual Verification
1.  **Create Support Order**:
    -   Merchandise (T-Shirt, Size L).
    -   Campsite (Site 101, 3 Nights).
    -   Subevent (Dinner, Vegetarian).
    -   Pit Crew Ticket (Linked to Pilot "John Doe").
2.  **View Invoice**:
    -   Verify Invoice ID `INV-...`.
    -   Verify **NO DUPLICATE ROWS**.
    -   Verify "Size: L" is shown under T-Shirt.
    -   Verify Dates shown under Campsite.
    -   Verify "Vegetarian" under Dinner.
    -   Verify "Pilot: John Doe" under Pit Crew.
