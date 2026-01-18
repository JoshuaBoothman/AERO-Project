# Pilot Registration & Access Control Implementation Plan

## Goal Description
Implement strict access control where only registered pilots can access the shop, and enforce that all new registrations must include an AUS Number. Additionally, differentiate between "Registered Pilots" (can buy merch) and "Event Attendees" (can buy merch + camping + assets + subevents). Non-logged-in users (General Public) cannot see the shop.

## User Review Required
> [!IMPORTANT]
> **Breaking Change**: The `getStoreItems` API will be modified to require authentication. Public users will no longer be able to fetch shop data. Frontend will redirect unauthenticated users to login when accessing store pages.
> **Homepage**: Non-logged-in users will see the event but NO "Get Tickets" / "Visit Store" buttons.

> [!WARNING]
> **Database Migration**: A new column `aus_number` will be added to the `users` table as `NOT NULL` (enforcing strict requirement). Existing users will be backfilled with placeholder data.

> [!NOTE]
> **Access Logic**:
> - **Public**: No Shop Access.
> - **Registered Pilot**: Merch Only. "Camping", "Assets", "Program" tabs disabled/greyed out.
> - **Event Attendee**: Full Access.
> - **Cart Logic**: Pilot becomes "Attendee" if they have a Ticket in their order history OR their current active cart. Checking out will re-verify this.

## Proposed Changes

### Database
#### [MODIFY] [users table](file:///c:/laragon/www/AERO-Project/api/src/functions/authRegister.js)
- Add `aus_number` column (NVarChar, NOT NULL) to `users` table.
- **SQL Script Provided**: `docs/schema_updates/01_add_aus_number.sql`

### API (`api/src`)
#### [MODIFY] [authRegister.js](file:///c:/laragon/www/AERO-Project/api/src/functions/authRegister.js)
- Validate `ausNumber` in request body.
- Insert `ausNumber` into `users` table.

#### [MODIFY] [getStoreItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getStoreItems.js)
- Add authentication check (`validateToken`).
- Return 401 if not logged in.
- OPTIONAL: Return `isAttendee` status in the response to help frontend UI (allows avoiding an extra API call).

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Add strict validation:
    - If Order includes `campsites`, `assets`, or `subevents`:
        - Check if User has an existing valid ticket for this event in `attendees` table.
        - OR Check if User is purchasing a ticket in the *current* order (`items` array).
    - If neither, throw Error: "Must be an event attendee to book service items."

### Frontend (`client/src`)
#### [MODIFY] [Register.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Register.jsx)
- Add "AUS Number" input field (Required).
- Send `ausNumber` to backend.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Handle 401 from `getStoreItems` -> Redirect to Login.
- Use `isAttendee` to conditionally Render tabs.
    - `isAttendee` = User has Ticket in `attendees` table OR Ticket item in valid `cart`.
    - If NOT Attendee:
        - Show "Merchandise" Tab.
        - **Grey Out/Disable** "Hire Assets", "Program", "Camping".
        - On Click Disabled Tab -> Show Notification: "Please add an Event Ticket to your cart to access this section."
    - If Attendee: Show all tabs.

#### [MODIFY] [ShopIndex.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/ShopIndex.jsx)
- Check Auth on load. If not logged in, redirect to Login or show "Login to View Stores".
- Hide "Visit Store" button if not logged in.

#### [MODIFY] [Home.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Home.jsx)
- If user is NOT logged in: Hide "Visit Store" / "Get Tickets" buttons. Only show Event info.

## Verification Plan

### Automated Tests
- None existing.

### Manual Verification
1.  **Registration Flow**:
    - Try to register without AUS Number -> Expect Error.
    - Register WITH AUS Number -> Expect Success.
    - Verify `aus_number` in DB.

2.  **Access Control (Public)**:
    - Open Incognito window.
    - Go to `/shop` -> Redirect to Login?
    - Go to `/store/event-slug` -> Redirect to Login?

3.  **Access Control (Pilot - No Ticket)**:
    - Login as the new pilot user.
    - Go to `/store/event-slug`.
    - Verify ONLY Merchandise tab is active/visible.
    - Verify Alert message is shown.
    - Try to buy Merch -> Expect Success.

4.  **Access Control (Attendee - With Ticket)**:
    - Login as Admin (or user with ticket).
    - Go to `/store/event-slug`.
    - Verify ALL tabs are visible.
    - Try to book Camping -> Expect Success.
