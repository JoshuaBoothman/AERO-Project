# Legacy Campsite Booking - Editing Implementation Plan

## Goal
Enable users to edit "Legacy" campsite bookings (bookings made by admins on their behalf) directly from their Cart. Users need to be able to change **dates** and **guest counts** (adults/children), but **CANNOT** change the assigned campsite. The system must preserve the original base price while calculating guest fees dynamically based on the new details.

## User Review Required
> [!IMPORTANT]
> **Logic Update in `createOrder`**: When a user submits an order that "replaces" a legacy booking (by providing `legacyOrderId`), the system will **DELETE** the original legacy booking/order items to release the old site/dates *before* creating the new booking. This ensures the user doesn't end up with two bookings (one paid, one pending).

## Requirements (Updated)
> [!IMPORTANT]
> **Site Switching**: **NOT ALLOWED**. Users must stay in their assigned campsite. The Map will be locked to read-only for the site selection.
>
> **Pricing Rules**:
> 1.  **Base Site Price**: **FIXED**. The cost for the campsite itself is determined by the *original* dates set by the Admin. Changing dates (extending/shortening stay) **DOES NOT** change this base component.
> 2.  **Guest Fees**: **VARIABLE**. Adding extra adults/children *does* incur extra fees (or reduce them) based on the *new* duration and count.
>     *   Formula: `Total = (Original_Nights * Rate) + (New_Nights * Extra_Guest_Rate * Extra_Guests)`
>
> **Safety**: The logic remains that the old booking is swapped for the new one at checkout to prevent data loss.
>
> **Extended Dates (Admin)**: The Admin Tool (`createLegacyBooking`) must also be updated to allow booking dates **1 day before** and **1 day after** the official event dates, consistent with the rules recently applied to the public booking flow.

## Proposed Changes

### Database Changes
No schema changes.

### Backend API

#### 1. [MODIFY] [createLegacyBooking.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createLegacyBooking.js)
*   **Date Window**: Update validation logic to allow `event.start_date - 1 day` and `event.end_date + 1 day`.

#### 2. [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Validation**:
    *   **Lock Campsite**: Ensure `submittedCampsiteId === legacyBooking.campsiteId`. Reject if different.
*   **Pricing Logic**:
    *   Fetch `legacyBooking` dates.
    *   Calculate `OriginalBasePrice` using legacy dates and site rate.
    *   Calculate `NewGuestExtras` using *submitted* dates and guest counts.
    *   Verify `SubmittedPrice == OriginalBasePrice + NewGuestExtras`.

#### 2. [MODIFY] [getLegacyBookings.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getLegacyBookings.js)
*   Include `campground_id` and ensuring `price_per_night` / `full_event_price` are available for frontend context.

#### 3. [MODIFY] [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js)
*   Still needed: `exclude_order_id` param.
    *   Even though site switching is disabled, we still need to check if the *new dates* for the *same site* are available (e.g. extending stay).
    *   We exclude the current booking so it doesn't block itself, then check if the requested window overlaps with *other* bookings.

### Frontend

#### 4. [MODIFY] [CartContext.jsx](file:///c:/laragon/www/AERO-Project/client/src/context/CartContext.jsx)
*   **Store Original State**: When interpreting a legacy booking, calculate and store `originalBasePrice`.
*   **Add Item**: Pass this `originalBasePrice` into the cart item.

#### 5. [Modify] [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx)
*   **ReadOnly Mode**: If `existingBooking` is present:
    *   **Map**: Visuals only. Clicking other sites does nothing.
    *   **Campground Select**: Hidden or Disabled.
*   **Pricing Display**:
    *   Show "Base Price (Locked): $X".
    *   Show "Extra Guest Fees: $Y".
    *   Update Total dynamically as guests/dates change, but keep Base fixed.

#### 6. [MODIFY] [Checkout.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Checkout.jsx)
*   **Edit Button**: As planned.
*   **Update Handler**: Ensure `originalBasePrice` is preserved in the new cart item.

## Verification Plan

### Automated Tests
*   We will rely on manual verification as this involves complex UI/Map interactions and multi-step cart flows.

### Manual Verification
1.  **Setup**:
    *   Run the provided SQL script (below) to ensure a Legacy Booking exists for your test user (e.g., `dave@test.com`).
    *   Ensure the site (e.g., Site 5) is "Booked" in the database.

2.  **Claim & View**:
    *   Login as the test user.
    *   Go to Cart/Checkout.
    *   **Verify**: The legacy booking (Site 5) appears in the cart.

3.  **Edit - Change Dates**:
    *   Click "Edit".
    *   **Verify**: Modal opens, Site 5 is selected and Green (Available).
    *   Change Dates to +/- 1 day.
    *   Click "Confirm".
    *   **Verify**: Cart updates with new dates/price.

4.  **Edit - Change Site**:
    *   Click "Edit".
    *   Deselect Site 5, Select Site 6.
    *   Click "Confirm".
    *   **Verify**: Cart shows Site 6.

5.  **Checkout**:
    *   Complete Checkout (Pay).
    *   **Verify**:
        *   **DB**: Old `campsite_bookings` for Site 5 is DELETED (or updated if same site).
        *   **DB**: New `campsite_bookings` for Site 6 exists.
        *   **Cart**: Empty.
        *   **Legacy**: The original Legacy Order should be gone or empty.

## SQL Script (For Setup/Reset)
Run this to create a fresh "Legacy" state for testing.

```sql
-- VARS
DECLARE @Email NVARCHAR(100) = 'legacy_user@test.com';
DECLARE @FirstName NVARCHAR(100) = 'Legacy';
DECLARE @LastName NVARCHAR(100) = 'User';
DECLARE @SiteNumber NVARCHAR(50) = '10'; -- Change to a valid site number for Event 1
DECLARE @EventId INT = 1; -- Assuming Event ID 1

-- 1. Create User if not exists
DECLARE @UserId INT;

IF NOT EXISTS (SELECT * FROM users WHERE email = @Email)
BEGIN
    INSERT INTO users (email, password_hash, first_name, last_name, is_email_verified, is_legacy_import)
    VALUES (@Email, 'dummy_hash', @FirstName, @LastName, 1, 1);
    SET @UserId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @UserId = user_id FROM users WHERE email = @Email;
END

-- 2. Create Order
INSERT INTO orders (user_id, total_amount, payment_status, amount_paid, booking_source)
VALUES (@UserId, 0, 'Pending', 0, 'Legacy');

DECLARE @OrderId INT = SCOPE_IDENTITY();

-- 3. Get Campsite & Person
DECLARE @CampsiteId INT = (SELECT top 1 campsite_id FROM campsites c JOIN campgrounds cg ON c.campground_id = cg.campground_id WHERE cg.event_id = @EventId AND c.site_number = @SiteNumber);

-- If campsite not found, pick any available one? Or error out?
IF @CampsiteId IS NULL
BEGIN
    -- Just pick the first one for Event 1
    SELECT TOP 1 @CampsiteId = c.campsite_id FROM campsites c JOIN campgrounds cg ON c.campground_id = cg.campground_id WHERE cg.event_id = @EventId;
END

DECLARE @PersonId INT = (SELECT top 1 person_id FROM persons WHERE user_id = @UserId); 
-- Ensure person exists
IF @PersonId IS NULL
BEGIN
    INSERT INTO persons (user_id, first_name, last_name, email) VALUES (@UserId, @FirstName, @LastName, @Email);
    SET @PersonId = SCOPE_IDENTITY();
END

-- 4. Create Attendee & Order Item
INSERT INTO attendees (event_id, person_id, ticket_type_id, status) 
VALUES (@EventId, @PersonId, (SELECT top 1 ticket_type_id FROM event_ticket_types WHERE event_id = @EventId), 'Registered');
DECLARE @AttendeeId INT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase, quantity)
VALUES (@OrderId, @AttendeeId, 'Campsite', @CampsiteId, 0, 1);
DECLARE @OrderItemId INT = SCOPE_IDENTITY();

-- 5. Book
INSERT INTO campsite_bookings (campsite_id, order_item_id, check_in_date, check_out_date, number_of_adults, number_of_children)
VALUES (@CampsiteId, @OrderItemId, '2026-04-10', '2026-04-15', 1, 0);

SELECT 'Created Legacy Booking' as Status, @OrderId as OrderId, @CampsiteId as CampsiteId;
```
