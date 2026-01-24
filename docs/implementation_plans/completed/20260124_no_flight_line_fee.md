# Implement No Flight Line Duties Fee

## Goal Description
The goal is to implement a pricing mechanism where pilot tickets have a potentially higher price if the pilot does not agree to perform "flight line duties".
Currently, there is a "Standard" price. We will add a "No Flight Line Duties Price".
If the user checks "I agree to perform flight line duties", they typically get the standard (lower) price.
If they do NOT check it, they get the `price_no_flight_line` (if set).
This requires changes to the database, admin interface, purchase UI, and backend order validation.

## User Review Required
> [!IMPORTANT]
> **Pricing Logic Assumption**:
> - The existing `price` field represents the "Standard" price (which users get if they **AGREE** to duties).
> - The new `price_no_flight_line` field represents the price if they **DO NOT AGREE** to duties.
> - If `price_no_flight_line` is NULL or 0, the standard `price` is used regardless of the checkbox.
> - This logic applies ONLY to tickets with `system_role = 'pilot'`.

## Proposed Changes

### Database
#### [MODIFY] [Schema](file:///c:/laragon/www/AERO-Project/api/src/start.js) (or via SQL script)
- Add `price_no_flight_line` (DECIMAL(10,2), nullable) to `event_ticket_types` table.
- I will verify if a migration script is needed or if I can use the `db-governance` skill.

### Backend (API)
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
- Update `createTicketType` to accept and insert `price_no_flight_line`.
- Update `updateTicketType` to accept and update `price_no_flight_line`.
- Update `getTicketTypes` to select `price_no_flight_line`.

#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
- Update the SQL query for ticket types to include `price_no_flight_line`.

#### [MODIFY] [getTicketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getTicketTypes.js)
- Update the SQL query to include `price_no_flight_line`.

#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
- Fetch `price_no_flight_line` when validating ticket prices.
- Logic update:
  ```javascript
  // Inside loop for items
  const isPilot = ticket.system_role === 'pilot';
  const agreedToDuties = attendeeData.flightLineDuties;
  let finalPrice = ticket.price;
  
  if (isPilot && !agreedToDuties && ticket.price_no_flight_line != null) {
      finalPrice = ticket.price_no_flight_line;
  }
  // Validate calculated total vs backend calculation
  ```

### Frontend (Client)
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- In the **Ticket Modal**:
  - Add an input field for "Price ($) - No Flight Line Duties".
  - Only show or enable this if `system_role` is 'pilot' (optional, but good UX).

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- In the `ticket.system_role === 'pilot'` section:
  - Display the price implication near the "Flight Line Duties" checkbox.
  - E.g., "(Save $X if selected)" or "Standard Price: $X | No Duties: $Y".
  - If `ticket.price_no_flight_line` is set:
    - Show `price` and `price_no_flight_line`.
    - Be clear that ticking the box grants the lower price.

## Verification Plan

### Automated Tests
- None existing.

### Manual Verification
1. **Admin Setup**:
   - Go to Admin > Edit Event > Ticket Types.
   - Edit a "Pilot" ticket.
   - Set "Standard Price" (e.g., $100) and "No Flight Line Duties Price" (e.g., $150).
   - Save.
   - Verify changes persist.

2. **User Purchase**:
   - Go to Event Page.
   - Add Pilot Ticket to cart.
   - Proceed to checkout (Attendee Details).
   - **Scenario A**: Tick "Agree to duties". Verify total price is $100.
   - **Scenario B**: Untick "Agree to duties". Verify total price is $150.
   - Verify UI shows the price difference clearly.
   - Submit Order.
   - Verify Order is created with correct total amount.
