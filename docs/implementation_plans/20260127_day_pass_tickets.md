# Day Pass Tickets Implementation Plan

## Goal
Enable "Day Pass" functionality for event tickets. Day Pass tickets allow users to select a specific date range, with the price calculated based on the number of days selected (Daily Price * Day Count). Additionally, specific logic applies to "Flight Line Duties" for these tickets: the question is only presented if the selected duration is 3 days or more.

## User Review Required
> [!IMPORTANT]
> **Database Change Required**: This plan requires running a SQL script to add the `is_day_pass` column to the `event_ticket_types` table. Please run the script provided below before approving this plan.

> [!NOTE]
> **Scope Clarification - Pit Crew Tickets**:
> This plan's logic for "Flight Line Duties" visibility (requiring 3+ days) applies strictly to the **Pilot** role.
> Pit Crew tickets can also be Day Passes (`is_day_pass = true`). For Pit Crew, the "Flight Line Duties" logic is determined by the [Pit Crew Tickets Plan](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) (dependent on AUS Number, not duration).
> The **Day Pass Pricing Logic** (Daily Rate * Days), however, is universal and applies to ALL tickets marked `is_day_pass`, including Pit Crew.

## Proposed Changes

### Database
#### [NEW] [20260127_add_day_pass_to_tickets.sql](file:///c:/laragon/www/AERO-Project/20260127_add_day_pass_to_tickets.sql)
- Add `is_day_pass` column (BIT, default 0) to `event_ticket_types` table.

```sql
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('event_ticket_types') AND name = 'is_day_pass')
BEGIN
    ALTER TABLE event_ticket_types ADD is_day_pass BIT DEFAULT 0 NOT NULL;
END
GO
```

### API
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
- Update `getTicketTypes` to select `is_day_pass`.
- Update `createTicketType` to accept and insert `is_day_pass`.
- Update `updateTicketType` to accept and update `is_day_pass`.

### Client
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- Update `ticketForm` state to include `is_day_pass`.
- Add a checkbox "Day Pass Logic?" to the Ticket Modal in the admin event form.
- Ensure `is_day_pass` is saved/updated correctly.

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- Update logic for "Flight Line Duties":
    - Only show if (`system_role` is 'pilot') AND (`!is_day_pass` OR `duration >= 3`).
- Calculate `duration` from `arrivalDate` and `departureDate` for use in the above logic.
- Ensure `arrivalDate` and `departureDate` are enforced.
- (Optional) detailed price breakdown display in the modal for day passes.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)
- Update `handleConfirmTicket` to calculate price for Day Pass tickets.
    - If `ticket.is_day_pass` is true:
        - Calculate `dayCount` (inclusive of arrival and departure dates).
        - `finalPrice = ticket.price * dayCount`.
        - **Logic Change**: Unlike standard pilot tickets, Day Pass tickets do NOT have a surcharge/discount for flight line duties. The price is fixed per day.
        - The `flightLineDuties` checkbox (if shown) does not affect the price.

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- Update logic for "Flight Line Duties" visibility:
    - Show if (`system_role` is 'pilot') AND (`!is_day_pass` OR `duration >= 3`).
- Update logic for Price Display in Modal:
    - If `is_day_pass`: Show "Price: $X (Fixed Rate)" regardless of checkbox state.
    - If `!is_day_pass`: Keep existing logic (Standard vs No Duties Surcharge).


## Verification Plan

### Manual Verification
1.  **Database**: Run the provided SQL script and verify the column exists.
2.  **Admin**:
    - Go to `/events` and edit an event.
    - Create a new Ticket Type "Day Pass Pilot" with `is_day_pass = true`, Role = Pilot, Price = $50.
    - Create a standard ticket "Full Event Pilot" with `is_day_pass = false`, Role = Pilot, Price = $200.
3.  **User Store**:
    - Go to the Store Page as a user.
    - **Test Day Pass**:
        - Select "Day Pass Pilot".
        - Choose 1 day (e.g., Arrival = Departure). Verify Price = $50. Verify "Flight Line Duties" is HIDDEN.
        - Choose 3 days. Verify Price = $150. Verify "Flight Line Duties" is VISIBLE.
        - Toggle Flight Line Duties (if visible) and check price (if flight line surcharge exists).
    - **Test Standard Ticket**:
        - Select "Full Event Pilot".
        - Change dates. Verify Price remains $200. Verify "Flight Line Duties" is ALWAYS visible.
4.  **Cart**:
    - Add to cart and verify the calculated price is correct in the cart summary.

### Automated Tests
- None planned for this UI/Logic change in this iteration.
