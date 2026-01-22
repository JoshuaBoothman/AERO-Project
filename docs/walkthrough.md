# Walkthrough - Phone Number & My Planes

## My Planes Management (New)
I have successfully implemented the "My Planes Management" feature, allowing users to view, edit, and delete their registered planes.

### Changes

#### Database
-  Used existing `planes` table.
-  **Dependencies**: verified relationships with `persons` and `event_planes`.

#### Frontend (Client)
- **File**: `client/src/pages/MyPlanes.jsx`
    -   **New Page**: Lists all planes owned by the user.
    -   **Features**:
        -   Display details (Name, Model, Rego, Weight, Heavy Model status).
        -   **Edit**: Modal to update all fields including Heavy Model Certificate upload.
        -   **Delete**: functionality with confirmation.
- **File**: `client/src/components/Layout.jsx`
    -   Added "My Planes" navigation link.
    -   **Logic**: Link only appears if the user has registered planes (`GET /api/planes` returning > 0).
- **File**: `client/src/App.jsx`
    -   Added route `/my-planes`.

#### Backend (API)
- **File**: `api/src/functions/getPlanes.js` (New)
    -   Fetches planes for the authenticated user (via `persons` table link).
- **File**: `api/src/functions/updatePlane.js` (New)
    -   Updates plane details.
    -   **Security**: Ensures user owns the plane before updating.
- **File**: `api/src/functions/deletePlane.js` (New)
    -   Deletes a plane.
    -   **Validation**: Prevents deletion if the plane is linked to an active event (`event_planes` check).

### Verification
1.  **Navigation**:
    -   Log in as a user *without* planes -> "My Planes" link should **NOT** be visible.
    -   Log in as a user *with* planes -> "My Planes" link **SHOULD** be visible.
2.  **Management**:
    -   Navigate to `/my-planes`.
    -   **Edit**: Click pencil icon, change "Weight" or re-upload certificate. Save. Refresh to verify persistence.
    -   **Delete**: Click trash icon. Confirm. Plane should disappear.
3.  **Safety**:
    -   Try to delete a plane that is currently registered for an upcoming event (if applicable). Expected: Error message "Cannot delete plane...".

---

# Walkthrough - Attendee Phone Number (Previous)

I have successfully implemented the collection of phone numbers for attendees.

## Changes

### Database
-  Verified `persons` table schema.
-  **User Action Required**: Run `docs/schema/20260122_add_phone_number.sql` (Confirmed as Done).

### Host/Frontend (Client)
- **File**: `client/src/components/AttendeeModal.jsx`
- **Changes**: 
    - Added `Phone Number` input field.
    - Added `phoneNumber` to state and validation logic.
    - Pre-fills with User's phone number if available.

### Backend (API)
- **File**: `api/src/functions/createOrder.js`
- **Changes**:
    - Updated `INSERT` and `UPDATE` queries for `persons` table to include `phone_number`.
    - Handles both Main User and Guest Attendees.
- **File**: `api/src/functions/updateAttendee.js`
- **Status**: Already supported `phone_number` updates.

## Verification
1.  **Registration**: When registering for an event, the "Attendee Details" modal now asks for a Phone Number.
2.  **Validation**: The field is required.
3.  **Persistence**: The data is saved to the `persons` table in the database upon checkout.
