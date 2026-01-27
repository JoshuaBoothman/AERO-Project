# Event Tickets Attendee Details Update

## Goal Description
Update the Event Ticket Attendee Registration flow to ensure data integrity and improve user experience. This involves making all contact details mandatory, preventing default dates, clarifying the dinner attendance option, improving Heavy Model logic, and ensuring the form resets for new entries.

## User Review Required
> [!IMPORTANT]
> **Database Changes**: The plan requires running a SQL script to enforce `NOT NULL` constraints on contact details in the `persons` table. Please run the script provided below in SSMS.
> **Logic Confirmation**: The "Heavy Model Inspector" logic will now simply hide the plane details section without unticking the "Bringing Heavy Models" box, preserving the user's initial selection.

> [!WARNING]
> **Implementation Order Critical**: This plan is a REFINEMENT pass over the attendee modal. It should be implemented AFTER the following plans are stable:
> - [Day Pass Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) - Establishes `is_day_pass` logic
> - [Pit Crew Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) - Adds Pit Crew-specific fields
> - [Official Dinner Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_official_dinner_registrations.md) - Adds dinner opt-in
>
> The dinner wording change in this plan ("I will be attending") applies to the attendee details confirmation field, which is separate from the ticket purchase opt-in added by the Official Dinner plan.

## Proposed Changes

### Database
#### [SQL Script] Run in SSMS
The following script ensures data integrity by enforcing NOT NULL constraints on contact details.

```sql
-- SQL Script to Enforce NOT NULL Constraints on Persons Table
-- Run this script in SSMS to update the database schema.

BEGIN TRANSACTION;

-- Update existing NULL values to empty strings or defaults to prevent errors when applying NOT NULL constraint
UPDATE persons SET address_line_1 = '' WHERE address_line_1 IS NULL;
UPDATE persons SET city = '' WHERE city IS NULL;
UPDATE persons SET state = '' WHERE state IS NULL;
UPDATE persons SET postcode = '' WHERE postcode IS NULL;
UPDATE persons SET country = 'Australia' WHERE country IS NULL;
UPDATE persons SET emergency_contact_name = '' WHERE emergency_contact_name IS NULL;
UPDATE persons SET emergency_contact_phone = '' WHERE emergency_contact_phone IS NULL;

-- Apply NOT NULL constraints
ALTER TABLE persons ALTER COLUMN address_line_1 NVARCHAR(255) NOT NULL;
ALTER TABLE persons ALTER COLUMN city NVARCHAR(100) NOT NULL;
ALTER TABLE persons ALTER COLUMN state NVARCHAR(50) NOT NULL;
ALTER TABLE persons ALTER COLUMN postcode NVARCHAR(20) NOT NULL;
ALTER TABLE persons ALTER COLUMN country NVARCHAR(100) NOT NULL;
ALTER TABLE persons ALTER COLUMN emergency_contact_name NVARCHAR(255) NOT NULL;
ALTER TABLE persons ALTER COLUMN emergency_contact_phone NVARCHAR(50) NOT NULL;

COMMIT TRANSACTION;

PRINT 'Persons table updated successfully with NOT NULL constraints.';
```

### Client
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- **Validation**:
    - Update `handleSubmit` to ensure ALL contact fields are checked (Address, City, State, Postcode, Emergency Contact, etc.) for `system_role` tickets.
    - Fields: `address`, `city`, `state`, `postcode`, `country`, `emergencyName`, `emergencyPhone`.
- **Default Dates**:
    - Remove default `arrivalDate` and `departureDate` logic in the initialization effect.
    - Initialize these fields as empty strings to force user selection.
- **Heavy Models**:
    - Modify the `isHeavyModelInspector` change handler.
    - **Current**: Sets `bringingHeavyModels` to `false` when Inspector is Yes.
    - **New**: Remove the automatic uncheck. The UI rendering condition `data.bringingHeavyModels && !data.isHeavyModelInspector` will handle the hiding of the plane list.
- **Dinner Option**:
    - Rename label text from "Will you be attending the official dinner..." to "I will be attending (tick if yes)".
- **Dietary Requirements**:
    - Add `disabled={!data.attendingDinner}` to the dietary requirements textarea.
    - Logic: If not attending dinner, they cannot enter requirements.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- **Form Reset**:
    - Ensure `AttendeeModal` completely resets its state when opened.
    - Add a `key` prop to the `AttendeeModal` component in `StorePage.jsx` that changes when the modal opens or the ticket changes (e.g., `key={selectedTicketForModal ? selectedTicketForModal.id : 'closed'}`).
    - Alternatively, ensure the `useEffect` in `AttendeeModal` properly resets `details` when `show` becomes true, or `StorePage` passes a fresh `initialDetails` object.

## Verification Plan

### Automated Tests
- None planned for this UI-heavy form logic.

### Manual Verification
1.  **Run SQL Script**: Execute the script above and verify "Persons table updated successfully".
2.  **Contact Validation**:
    - Attempt to register a ticket with empty address/emergency fields.
    - Verify strict validation errors prevent submission.
3.  **Date Defaults**:
    - Open the modal for a new ticket.
    - Verify Arrival/Departure dates are blank (not pre-filled).
4.  **Heavy Models**:
    - Select "Bringing Heavy Models" (Tick).
    - Select "Heavy Model Inspector" (Yes).
    - **Verify**: "Bringing Heavy Models" stays ticked, but Plane List disappears.
5.  **Dinner & Diet**:
    - Verify new label text.
    - Verify Dietary box is disabled/greyed out.
    - Tick "I will be attending". Verify Dietary box enables.
6.  **New Ticket Reset**:
    - Fill out a ticket form partially (put random text).
    - Close or Add to Cart.
    - Open a *new* ticket.
    - Verify form is completely blank (no ghost data from previous filling).
