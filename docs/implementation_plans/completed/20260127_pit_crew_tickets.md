# Pit Crew Ticket Implementation Plan

## Goal Description
The goal is to update the Pit Crew ticket purchase flow to allow Pit Crew members to optionally enter an AUS Number. If they do, they should be given the option to volunteer for Flight Line Duties. Crucially, selecting Flight Line Duties should NOT affect the price of the Pit Crew ticket (unlike Pilot tickets where opting out of duties incurs a surcharge).

## User Review Required
> [!NOTE]
> No database changes are required. The `attendees` and `persons` tables already support `flight_line_duties` and `license_number` respectively.

> [!IMPORTANT]
> **Interaction with Day Pass Logic**:
> The user has confirmed that **Pit Crew tickets can also be Day Passes**.
> - **Pricing**: If the Pit Crew ticket is a Day Pass (`is_day_pass = true`), the **Day Pass Pricing Logic** (Daily Rate * Days) defined in the [Day Pass Plan](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) will apply.
> - **Flight Line Duties**: The logic for showing the "Flight Line Duties" checkbox differs by role:
>     -   **Pilots**: Depends on Duration (must be >= 3 days for Day Passes).
>     -   **Pit Crew**: Depends on **AUS Number**. If an AUS Number is entered, the option appears, **regardless of the duration** (even for a 1-day pass).
> - There is no conflict; the code handles these rules in separate blocks based on `system_role`.

## Proposed Changes

### Client
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- In the Pit Crew section (where `ticket?.system_role === 'pit_crew'`):
    - Add an input field for "AUS Number" (mapped to `licenseNumber` in state).
    - Add a conditional rendering block: If `licenseNumber` has a value, show a checkbox for "I agree to perform flight line duties" (mapped to `flightLineDuties` in state).
    - **Logic**: This logic applies for both Standard Pit Crew tickets and Day Pass Pit Crew tickets.
    - Ensure `flightLineDuties` is passed to the backend.

### API
No changes required.
- `createOrder.js` explicitly maps `licenseNumber` to the `persons` table (`license_number`) and `flightLineDuties` to the `attendees` table (`flight_line_duties`).
- The ticket pricing logic only applies the `price_no_flight_line` logic if the ticket's system role is `'pilot'` or `'junior_pilot'`. Since Pit Crew tickets have the role `'pit_crew'`, the price remains `price` (standard) regardless of the duty selection.

## Verification Plan

### Manual Verification
1.  **Open Store**: Navigate to the store page for an event.
2.  **Add Pit Crew Day Pass**: Add a Pit Crew ticket (configured as a Day Pass) to the cart.
3.  **Open Attendee Modal**: Click "Checkout" or "Add Details".
4.  **Verify New Fields**:
    -   Select a 1-day duration.
    -   Check that the "AUS Number" field appears.
    -   Enter a value in "AUS Number".
    -   Verify "Flight Line Duties" checkbox **appears** (confirming it is NOT hidden by the 1-day duration).
5.  **Submit Order**:
    -   Select "Flight Line Duties".
    -   Complete the order.
6.  **Verify Database**:
    -   Check `attendees` table for the new record. `flight_line_duties` should be `1`.
    -   Check `persons` table. `license_number` should be set.
    -   Check `order_items` table. `price_at_purchase` should match the calculated day pass price (no extra surcharge for duties status).
