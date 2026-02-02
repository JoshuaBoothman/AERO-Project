# Legacy Priority Booking Implementation

## Goal
Allow admins to manually reserve campsites for previous attendees who have not yet registered on the new system. When these attendees register and verify their email, the system should automatically link them to their existing booking.

## User Review Required
> [!NOTE]
> No database schema changes, but relies on `persons.user_id` being NULLable (which it is).

## Proposed Changes

### Admin Tool (Frontend & API)
#### [NEW] [AdminLegacyImport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminLegacyImport.jsx)
*   **Interface**: Simple form.
    *   **Attendee Details**: First Name, Last Name, Email.
    *   **Booking Details**: Event (Select), Campsite (Select - filtered by availability).
    *   **Action**: "Create Reservation".
*   **API Call**: `POST /api/admin/legacy-booking`.

#### [NEW] [createLegacyBooking.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createLegacyBooking.js)
*   **Logic**:
    1.  Check if `persons` exists with this email.
        *   If yes, use `person_id`.
        *   If no, CREATE `persons` (first_name, last_name, email, **user_id = NULL**).
    2.  Create `orders` record.
        *   `user_id` = NULL? (Schema constraint: `orders.user_id` might be NOT NULL).
        *   *Check Schema*: `orders.user_id` usually foreign key to users. if so, we might need a "System User" or "Legacy Placeholder User" to hold the order until claimed. Or make `orders.user_id` nullable?
        *   *Decision*: For simplicity, we can't easily make `orders.user_id` nullable if it's a strict FK.
        *   *Alternative*: Store the `order` linked to a special "Legacy Admin" user initially? Or creating a `users` record involves password hash.
        *   *Better Path*: Create a `users` record with a random complex password and `is_verified=0`.
        *   *Wait*: The prompt says "without them actually going through the process". If we create a User, they can't register with that email because "Email already registered".
        *   *Refined Plan*:
            *   We DO need to handle the `orders.user_id` constraint.
            *   Let's check `orders` schema. If `user_id` is required, we have a problem creating an order without a user.
            *   *Workaround*: Create a "Placeholder" User account? No, messy.
            *   *Pivot*: Can we store a "reservation" without an order? `campsite_bookings` links to `order_items` -> `orders` -> `users`. It's a chain.
            *   *Solution*: We will allow the Admin to create a "Shadow User" (Real entry in `users` table) but set a flag or just leave it unverified.
            *   *But*: If they try to Register, `authRegister` fails if email exists.
            *   *Fix*: Modify `authRegister` to "Take Over" an existing account if it is unverified and created by Admin? (Risky).
            *   *BEST PATH*:
                1.  Admin creates `users` record (Status: "Invited/Legacy", `password_hash` = random).
                2.  Admin creates `persons`, `orders`, `bookings` linked to this User.
                3.  **User Flow**: User clicks "Register".
                4.  **Updated `authRegister`**:
                    *   Check if email exists.
                    *   If exists AND `is_email_verified = 0` (and maybe a `is_legacy` flag? or just trust unverified?):
                    *   Instead of "Email already registered", we proceed.
                    *   UPDATE the `users` record with the new Password Hash and Name.
                    *   Trigger Verification Email.
                    *   (Effectively "Claiming" the account).

### API Updates
#### [MODIFY] [authRegister.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authRegister.js)
*   Update "Check if user exists" logic.
*   If `existingUser` exists but `is_email_verified === 0` (and maybe we add `is_legacy_import` bit to users table for safety?):
    *   **ALLOW** registration.
    *   Update `password_hash`, `first_name`, `last_name`.
    *   Reset `verification_token` and send email.
    *   Return success.

#### [MODIFY] [authVerifyEmail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authVerifyEmail.js)
*   (Logic remains mostly same, just ensures account becomes active).

### Schema Changes
*   **[Recommended]**: Add `is_legacy_import` (BIT) to `users` table to safely distinguish these "placeholder" accounts from regular unverified signups.

## Verification Plan
1.  **DB**: Add `is_legacy_import` column.
2.  **Admin Import**:
    *   Import "Dave Legacy" (dave@test.com) -> Assign Site 5.
    *   Verify `users` table has entry (Legacy=1).
    *   Verify Order/Booking exists linked to this user.
3.  **Registration Override**:
    *   Go to Register. Enter "dave@test.com" and NEW password.
    *   Submit.
    *   Verify it succeeds (instead of "Email taken").
    *   Verify `users` record is updated (New Hash).
4.  **Completion**:
    *   Verify Email. Log in.
    *   Check "My Orders" -> See legacy booking.
