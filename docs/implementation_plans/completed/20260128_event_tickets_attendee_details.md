# Event Tickets Attendee Details Update

## Goal Description
Update the Event Ticket Attendee Registration flow to ensure data integrity and improve user experience. This involves making all contact details mandatory via frontend validation, preventing default dates, clarifying the dinner attendance option, improving Heavy Model logic, and ensuring the form resets for new entries.

## User Review Required
> [!IMPORTANT]
> **Logic Confirmation**: 
> - **Validation**: Contact details will be enforced strictly in the frontend (`AttendeeModal.jsx`) instead of the database.
> - **Heavy Models**: The "Heavy Model Inspector" logic will now simply hide the plane details section without unticking the "Bringing Heavy Models" box, preserving the user's initial selection.
> - **Day Pass**: "Attending Dinner" and "Dietary Requirements" fields will be HIDDEN for Day Pass tickets.

> [!WARNING]
> **Implementation Order Critical**: This plan is a REFINEMENT pass over the attendee modal. It should be implemented AFTER the following plans are stable:
> - [Day Pass Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) - Establishes `is_day_pass` logic
> - [Pit Crew Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) - Adds Pit Crew-specific fields
> - [Official Dinner Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_official_dinner_registrations.md) - Adds dinner opt-in
>
> The dinner wording change in this plan ("I will be attending") applies to the attendee details confirmation field, which is separate from the ticket purchase opt-in added by the Official Dinner plan.

## Proposed Changes

### Client
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- **Validation**:
    - Update `handleSubmit` to ensure ALL contact fields are checked (Address, City, State, Postcode, Emergency Contact, etc.) for `system_role` tickets.
    - Fields: `address`, `city`, `state`, `postcode`, `country`, `emergencyName`, `emergencyPhone`.
    - Note: This matches strict `NOT NULL` expectations without modifying the DB schema.
- **Day Pass Logic**:
    - **Hide Fields**: If `ticket.is_day_pass` is true:
        - Do NOT show the "Attending Official Dinner" checkbox.
        - Do NOT show the "Dietary Requirements" field.
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
    - Add `disabled={!data.attendingDinner}` to the dietary requirements textarea (unless hidden for Day Pass).
    - Logic: If not attending dinner, they cannot enter requirements.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- **Form Reset**:
    - Ensure `AttendeeModal` completely resets its state when opened.
    - Add a `key` prop to the `AttendeeModal` component in `StorePage.jsx` that changes when the modal opens or the ticket changes (e.g., `key={selectedTicketForModal ? selectedTicketForModal.id : 'closed'}`).

## Verification Plan

### Automated Tests
- None planned for this UI-heavy form logic.

### Manual Verification
1.  **Contact Validation**:
    - Attempt to register a ticket with empty address/emergency fields.
    - Verify strict validation errors prevent submission.
2.  **Date Defaults**:
    - Open the modal for a new ticket.
    - Verify Arrival/Departure dates are blank (not pre-filled).
3.  **Heavy Models**:
    - Select "Bringing Heavy Models" (Tick).
    - Select "Heavy Model Inspector" (Yes).
    - **Verify**: "Bringing Heavy Models" stays ticked, but Plane List disappears.
4.  **Day Pass Tickets**:
    - Select a Day Pass ticket.
    - **Verify**: "Official Dinner" and "Dietary Requirements" sections are NOT visible.
5.  **Standard Tickets (Dinner & Diet)**:
    - Select a Standard Ticket.
    - Verify new label text "I will be attending (tick if yes)".
    - Verify Dietary box is disabled/greyed out initially.
    - Tick "I will be attending". Verify Dietary box enables.
6.  **New Ticket Reset**:
    - Fill out a ticket form partially (put random text).
    - Close or Add to Cart.
    - Open a *new* ticket.
    - Verify form is completely blank (no ghost data from previous filling).
