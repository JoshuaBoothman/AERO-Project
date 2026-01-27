
## [2026-01-18] - Pilot Registration Features
**Milestone:** Pilot MOP Agreement, Multi-Plane Support & Heavy Model Certification

### Completed Items
*   **Database**
    *   **Schema:** Verified `planes` table (non-nullable `weight_kg`) and `attendees` table (added `has_agreed_to_mop`).
*   **Backend (API)**
    *   **Feature:** Updated `createOrder.js` to:
        *   Save `license_number` to `persons`.
        *   Insert `has_agreed_to_mop` into `attendees`.
        *   Insert related `planes` records (make, model, rego, heavy/cert details).
        *   **Fix:** Provided default `0` for `weight_kg` to resolve constraint violation.
    *   **Feature:** Updated `getOrderDetail.js` to:
        *   Return `license_number` and associated aircraft for pilot attendees.
        *   **Fix:** Added missing `person_id` to SELECT clause to prevent 500 errors.
    *   **Integration:** Heavy Model Certificates are uploaded via `uploadImage` (Azure Blob).
*   **Frontend (Client)**
    *   **Event Details:**
        *   **MOP:** Implemented mandatory checkbox for Pilots to agree to Manual of Procedures.
        *   **Multi-Plane:** Created a dynamic aircraft list (Add/Remove) per pilot ticket.
        *   **Heavy Models:** Added conditional inputs for Weight > 7kg (Certificate # + File Upload).
        *   **UX:** Improved Validation logic – Errors now appear as non-intrusive Toast Notifications instead of blocking page renders.
        *   **UI:** Fixed "Remove Plane" button overlap by redesigning the list item layout.
    *   **Order Details:**
        *   Added "Pilot Details" section to Order Items, listing linked aircraft and Heavy Model certificates.

## [2026-01-27] - Official Dinner Registration & Cart Fixes
**Milestone:** Complete implementation of Official Dinner add-on flow for Tickets and Store.

### Completed Items
*   **Database**
    *   **Schema:** Added `official_dinner_subevent_id` to `events` table.
    *   **Schema:** Added `includes_official_dinner` (bit) to `event_ticket_types` table.
*   **Backend (API)**
    *   **Feature:** Updated `getEventDetail` and `getStoreItems` to return official dinner config and ticket flags.
    *   **Feature:** Updated `createEvent` and `updateEvent` to handle `official_dinner_subevent_id`.
    *   **Feature:** Updated `createTicketType` and `updateTicketType` to handle `includes_official_dinner`.
*   **Frontend (Client)**
    *   **Admin:** Added "Official Dinner Subevent" dropdown to Event Form.
    *   **Admin:** Added "Include Official Dinner Entry?" checkbox to Ticket Type form.
    *   **Purchase Flow:** Updated `EventPurchase.jsx` (Ticket Shop) to:
        *   Prompt user "Will you be attending the official dinner?".
        *   Automatically add the Dinner Subevent to cart (at $0 cost) if opted-in.
        *   Fixed Cart Item structure for Subevents to match Checkout requirements (`type: 'SUBEVENT'`, `id`).
    *   **Store Flow:** Updated `StorePage.jsx` (General Shop) to:
        *   Replicate the auto-add dinner logic for single ticket purchases via existing `AttendeeModal`.
        *   Fixed missing API fields in `getStoreItems`.
    *   **Fix:** Resolved issue where Official Dinner was missing from Cart during Checkout.
