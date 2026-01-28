# Recover Login (Password Reset) Implementation Plan

## Goal
Implement a secure process for users to recover their account access if they have lost their password. This will involve an email-based flow where the user requests a reset link, receives an email with a secure token, and uses that link to set a new password.

## User Review Required
> [!IMPORTANT]
> **Database Schema Changes Required**
> Before applying the changes, you must update the database schema. Run the following SQL commands (or equivalent) for both `users` and `admin_users` tables:
> ```sql
> ALTER TABLE users ADD reset_password_token NVARCHAR(255) NULL;
> ALTER TABLE users ADD reset_password_expires DATETIME NULL;
> 
> ALTER TABLE admin_users ADD reset_password_token NVARCHAR(255) NULL;
> ALTER TABLE admin_users ADD reset_password_expires DATETIME NULL;
> ```

## Proposed Changes

### Database (Schema)
- Add `reset_password_token` and `reset_password_expires` columns to `users` and `admin_users` tables.

### Backend (`api/src`)

#### [MODIFY] [emailService.js](file:///c:/laragon/www/AERO-Project/api/src/lib/emailService.js)
- Add `sendPasswordResetEmail(email, token, firstName, siteUrl)` function.
- Should use `Resend` to send an email with a link: `{siteUrl}/reset-password?token={token}`.

#### [NEW] [authRecover.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authRecover.js)
- **Route**: `POST /api/authRecover`
- **Logic**:
    1.  Receive `email`.
    2.  Check if user exists in `users` or `admin_users`.
    3.  Generate a secure random token (hex string).
    4.  Set expiry (e.g., 1 hour from now).
    5.  Update the user record with the token and expiry.
    6.  Call `sendPasswordResetEmail`.
    7.  Return success (generic message even if user not found, to prevent enumeration, or specific if preferred for internal apps - sticking to standard security practice of "If that email exists, we sent a link").

#### [NEW] [authResetPassword.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authResetPassword.js)
- **Route**: `POST /api/authResetPassword`
- **Logic**:
    1.  Receive `token` and `newPassword`.
    2.  Find user with matching `reset_password_token` where `reset_password_expires` > NOW.
    3.  If invalid/expired, return error.
    4.  Hash the `newPassword` (using `bcryptjs`).
    5.  Update user's `password_hash`.
    6.  Clear `reset_password_token` and `reset_password_expires`.
    7.  Return success.

### Frontend (`client/src`)

#### [NEW] [RecoverLogin.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/RecoverLogin.jsx)
- Simple form asking for Email.
- Calls `/api/authRecover`.
- Shows success message: "If an account exists for this email, you will receive a password reset link shortly."

#### [NEW] [ResetPassword.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/ResetPassword.jsx)
- Reads `token` from URL query params.
- Form asking for New Password (and Confirm Password).
- Calls `/api/authResetPassword`.
- On success, redirects to `/login` with a toast/message.

#### [MODIFY] [App.jsx](file:///c:/laragon/www/AERO-Project/client/src/App.jsx)
- Add routes:
    - `<Route path="recover-login" element={<RecoverLogin />} />`
    - `<Route path="reset-password" element={<ResetPassword />} />`

#### [MODIFY] [Login.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Login.jsx)
- Add "Forgot Password?" link pointing to `/recover-login`.

## Verification Plan

### Automated Tests
- None currently available for Auth flow.

### Manual Verification
1.  **Schema Check**: Verify columns exist in DB.
2.  **Request Reset**:
    - Go to `/login` -> Click "Forgot Password?".
    - Enter a valid email key.
    - Check "Work Log" or Console (backend) to see if email was "sent" (or check real email inbox if configured).
    - Verify `reset_password_token` is set in DB for that user.
3.  **Reset Password**:
    - Click link in email (or copy token from DB and construct URL `/reset-password?token=XYZ`).
    - Enter new password.
    - Submit.
    - Verify DB has new password hash and token is cleared.
4.  **Login**:
    - Try logging in with **old** password (should fail).
    - Try logging in with **new** password (should succeed).
5.  **Invalid Token**:
    - Try using an old/random token -> Should show error.
