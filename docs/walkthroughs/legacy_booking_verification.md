# Verification Plan: Legacy Campsite Bookings

This document outlines the steps to verify the "Legacy Campsite Booking" feature, ensuring that admins can pre-assign campsites and users can seamlessly claim them during registration and checkout.

## 1. Prerequisites
- **Admin Account**: Ensure you are logged in as an Administrator (`role = 'admin'`).
- **Clean State**: Ensure the test email you plan to use is NOT already registered in the `users` table.

## 2. Admin Import Process (Admin Side)
1.  Navigate to **Admin > Map Tool**.
2.  Select an **Event** and a **Campground**.
3.  Select an available **Campsite** (green or yellow).
4.  In the sidebar, locate the **"Import Legacy"** button (blue) under the "Editing Site" section.
5.  Click it to open the modal.
6.  Fill in the details:
    *   **First Name**: (e.g., "Legacy")
    *   **Last Name**: (e.g., "Tester")
    *   **Email**: (e.g., "legacy@example.com")
7.  Click **Import**.
8.  **Expected Result**:
    *   Success message: "Legacy booking created successfully!".
    *   The email `legacy@example.com` should receive a specific "Welcome Back" email with a link (simulated in local dev, check console logs if email service not live).
    *   **Database**:
        *   `users` table: New row for `legacy@example.com` with `is_legacy_import = 1`, `is_email_verified = 0`.
        *   `orders` table: New row with `booking_source = 'Legacy'`, `payment_status = 'Pending'`.
        *   `campsite_bookings`: New row linked to the order item.
        *   `campsites`: Site should now appear "Booked" (Red) on the map after refresh.

## 3. User Claim Process (User Side)
1.  Open an **Incognito Window** (to act as the new user).
2.  Navigate to `/register` (or click the link from the email if possible).
3.  **Registration**:
    *   Use the **EXACT EMAIL** (`legacy@example.com`).
    *   Enter a **Password**.
    *   Enter **First Name**, **Last Name**, **AUS Number**.
4.  Click **Register**.
5.  **Expected Result**:
    *   Success message (or redirect to verify page).
    *   The system detects the existing `is_legacy_import` account and UPDATES it (setting password) instead of erroring with "Email already exists".
    *   User receives a Verification Email.

## 4. Verification & Login
1.  "Verify" the email (click link or manually set `is_email_verified = 1` in DB for speed).
2.  **Login** with `legacy@example.com` / `password`.
3.  **Expected Result**: Login successful.

## 5. View Cart (Auto-Load)
1.  Navigate to simple `/` (Home) or any page.
2.  Check the **Cart** icon.
3.  **Expected Result**:
    *   The cart should automatically contain 1 Item: **"Campsite [Number]"**.
    *   Price should be calculated (e.g. $120.00).
    *   The item should be flagged (internally or visually) as the legacy booking.

## 6. Checkout (Transactional Merge)
1.  Proceed to **Checkout**.
2.  Fill in billing details.
3.  Click **Pay / Complete Order**.
4.  **Expected Result**:
    *   Order processes successfully.
    *   **Backend Logic Check**: The system detects the existing "Legacy" booking for this campsite.
    *   It **DELETES** the old Legacy Booking (releasing the "lock").
    *   It **CREATES** a new Booking linked to the NEW Order (the one just paid).
    *   No "Campsite Unavailable" error occurs (which would happen if the merge logic failed).

## 7. Final Verification
1.  Go to **My Orders**.
2.  Verify the new Order exists and contains the Campsite.
3.  Go to **Admin Map Tool** (as Admin).
4.  Verify the Campsite is still **Booked** (Red).
5.  Verify the booking is now linked to the new Order ID (not the legacy one).
