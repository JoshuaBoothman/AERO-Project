# Camping Fees Logic Update

## Goal Description
Implement logic to handle "per person" fees for camping bookings. The current system only charges per site (nightly or full event). The new system will charge an additional fee for each adult beyond the first one (who is covered by the site fee).

Logic:
- Site fee covers 1 adult.
- Extra adults = `Total Adults - 1`.
- Extra Fee can be "Per Person Per Night" OR "Per Person Full Event" (flat rate).
- Children < 16 are free.

## User Review Required
> [!IMPORTANT]
> **Schema Changes**: This plan requires schema changes associated with the `campsites` and `campsite_bookings` tables.
> The SQL script provided should be run manually by the user as requested.

## Proposed Changes

### Database Schema
#### [NEW] [camping_fees_schema.sql](file:///docs/updates/camping_fees_schema.sql)
- **Table `campsites`**:
  - Add `extra_adult_price_per_night` (DECIMAL)
  - Add `extra_adult_full_event_price` (DECIMAL)
- **Table `campsite_bookings`**:
  - Add `number_of_adults` (INT) - To store the number of adults for the booking record.
  - Add `number_of_children` (INT) - To store children count (optional but requested to be asked).

### API / Backend
#### [MODIFY] [campsites.js / createOrder.js](file:///api/src/functions/createOrder.js)
- **`createOrder` Function**:
  - Update `campsites` loop to accept `adults` and `children` counts from the request body.
  - Fetch `extra_adult_price_per_night` and `extra_adult_full_event_price` from the database used during availability/price check.
  - Calculate "Extra Adult Fee":
    - If `adults > 1`:
      - count = `adults - 1`
      - If "Full Event" pricing applied: `fee = count * extra_adult_full_event_price`
      - Else (Daily): `fee = count * extra_adult_price_per_night * nights`
      - *Fallback logic needed if one price is missing? Assuming if Full Event is chosen, that price must exist.*
  - Update validation to compare `totalAmount` with `(Base Site Price + Extra Adult Fee)`.
  - Insert `adults` and `children` into `campsite_bookings`.

#### [MODIFY] [updateCampsite.js](file:///api/src/functions/updateCampsite.js)
- **`updateCampsite` Function**:
  - Allow admin to update `extra_adult_price_per_night` and `extra_adult_full_event_price`.

### Admin / Frontend (For Context)
- `CampsiteModal.jsx` (User facing) will need to ask for number of adults/children and include them in the cart payload.
- `AdminMap` (Admin facing) will need inputs to set these new fee fields.

## Verification Plan

### Manual Verification
1.  **Schema**: Run the provided SQL script and verify columns are added.
2.  **Admin Update**: Use Postman or Admin UI (if updated) to set `extra_adult_price_per_night` = $10 and `extra_adult_full_event_price` = $40 for a campsite.
3.  **Booking Scenario 1 (Daily)**: 
    - Book campsite for 2 nights with 3 adults.
    - Expected Price: `(SiteDaily * 2) + ((3-1) * $10 * 2)`.
    - Verify `createOrder` accepts this price and rejects incorrect price.
4.  **Booking Scenario 2 (Full Event)**:
    - Book campsite for Full Event with 3 adults.
    - Expected Price: `SiteFull + ((3-1) * $40)`.
    - Verify `createOrder` accepts/rejects correctly.

-- Add columns for extra adult pricing to campsites
ALTER TABLE campsites
ADD extra_adult_price_per_night DECIMAL(10, 2) DEFAULT 0,
    extra_adult_full_event_price DECIMAL(10, 2) DEFAULT 0;

-- Add columns for guest counts to campsite_bookings
ALTER TABLE campsite_bookings
ADD number_of_adults INT DEFAULT 1,
    number_of_children INT DEFAULT 0;
