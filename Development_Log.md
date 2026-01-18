
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
