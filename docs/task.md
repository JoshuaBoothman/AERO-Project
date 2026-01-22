# Attendee Phone Number Implementation

- [x] **Database Schema**
    - [x] Run schema update script (`docs/schema/20260122_add_phone_number.sql`) on Dev & Master
- [x] **Frontend Implementation**
    - [x] Update `AttendeeModal.jsx` to include Phone Number input
    - [x] Add validation/pre-fill logic
- [x] **Backend Implementation**
    - [x] Update `api/src/functions/createOrder.js` to extract and save `phone_number`
    - [x] Update `api/src/functions/updateAttendee.js` to allow editing `phone_number`
- [ ] **Debugging**
    - [x] Fix React validation error in `AttendeeModal.jsx` (Investigated, likely environment/data flow)
    - [x] Fix "No event associated" cart error (Fixed missing eventId in StorePage)
    - [x] Verify database record creation (Fixed blockers in checkout flow)

- [x] **Refinements**
    - [x] **Schema**: Add `country` column to `persons` table (`docs/schema/20260122_add_country.sql`)
    - [x] **Frontend**:
        - [x] Pre-populate Arrival/Departure dates with Event dates
        - [x] Add `country` field (Default: Australia)
        - [x] Add State dropdown (AU states) + Custom input
        - [x] Validate Email format
        - [x] Validate DOB (No future dates)
    - [x] **Backend**:
        - [x] Update `createOrder` to save `country`
        - [x] Update `updateAttendee` to save `country`

