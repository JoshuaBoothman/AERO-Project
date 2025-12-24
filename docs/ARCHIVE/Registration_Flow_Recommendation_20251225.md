# Registration Flow Recommendations

## Goal Description
Implement a multi-role registration flow (Spectator, Pilot, Pit Crew) utilizing the existing relational schema for planes and crews, while fixing strict database constraints.

## User Review Required
> [!IMPORTANT]
> **Database Changes**:
> 1.  `persons.user_id` will be made NULLABLE (to allow creating persons without login accounts).
> 2.  `event_ticket_types` will get an `is_pilot` column (to flag which tickets ask for pilot info).
> 3.  **Assumption**: `license_number` already exists on the `persons` table, which is good. Insurance expiry is not there - do you want to add `insurance_expiry` to the `persons` table as well?

## Proposed Changes

### Database
#### [MODIFY] `persons` table
- Change `user_id` to `NULL`.
- (Optional) Add `insurance_expiry_date` if needed for pilots.

#### [MODIFY] `event_ticket_types` table
- Add `is_pilot` (BIT, Default 0).

### Backend (API)
#### [MODIFY] `api/src/functions/createOrder.js`
- **Pilot Logic**:
    - Check `is_pilot` flag on ticket type.
    - If true, update `persons` with license/insurance info.
    - Process `planes` list from request:
        - Insert new `planes` linked to `person_id`.
        - Insert `event_planes` to link these planes to current `event_id`.
- **Crew Logic**:
    - Support `linked_pilot` in attendee data.
    - Insert into `pilot_pit_crews` (linking `crew_attendee_id` -> `pilot_attendee_id`).
    - *Complexity*: Need to handle linking to a pilot *within the same transaction* (e.g., Pilot A is being created, Crew B links to Pilot A).

#### [MODIFY] `api/src/functions/getEventDetail.js`
- Return `is_pilot` field in the tickets list so frontend knows when to show fields.

### Frontend (Client)
#### [MODIFY] `app/src/components/EventDetails.jsx` & `AttendeeModal`
- **Logic Update**:
- Iterate through tickets in cart.
- If `ticket.is_pilot`:
    - Show "Pilot Details" (License).
    - Show "Aircraft Registration" (Add 1 or more planes).
    - *Future*: If logged in, fetch and show existing planes to select.
- If `ticket.system_role == 'crew'` (or similar check):
    - Show "Link to Pilot" dropdown.
    - Options: "Pilot in this order" OR "Enter Pilot Ticket Code" (for later).

## Verification Plan

### Database verification
- Run SQL query to insert a person with NULL `user_id` -> Should success.
- Run SQL query to select tickets with `is_pilot` = 1.

### Registration Flow verification
1.  **Pilot**: Register -> Check `persons` updated, `planes` created, `event_planes` created.
2.  **Crew**: Register linked to Pilot -> Check `pilot_pit_crews` created.
