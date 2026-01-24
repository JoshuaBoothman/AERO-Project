# Task: Implement No Flight Line Duties Fee

- [x] **Database**: Add `price_no_flight_line` to `event_ticket_types` <!-- id: 0 -->
    - [x] Check existing schema of `event_ticket_types` <!-- id: 1 -->
    - [x] Create and Provide SQL script to user <!-- id: 2 -->
    - [x] Verify database change <!-- id: 3 -->
- [x] **Backend**: Update Ticket Management <!-- id: 4 -->
    - [x] Update `createTicketType` and `updateTicketType` in `api/src/functions/ticketTypes.js` <!-- id: 5 -->
    - [x] Update `getTicketTypes` in `api/src/functions/getTicketTypes.js` (handled in `ticketTypes.js`) <!-- id: 6 -->
    - [x] Update `getEventDetail.js` to include new field <!-- id: 7 -->
    - [x] Update `getStoreItems.js` to include new field <!-- id: 16 -->
- [x] **Backend**: Note Pricing Logic <!-- id: 8 -->
    - [x] Update `createOrder.js` to handle `price_no_flight_line` logic <!-- id: 9 -->
- [x] **Frontend**: Update Admin Interface <!-- id: 10 -->
    - [x] Update `EventForm.jsx` to allow editing `price_no_flight_line` <!-- id: 11 -->
- [x] **Frontend**: Update User Interface <!-- id: 12 -->
    - [x] Update `AttendeeModal.jsx` to display price difference <!-- id: 13 -->
    - [x] Update `StorePage.jsx` to handle price difference <!-- id: 17 -->
- [x] **Verification** <!-- id: 14 -->
    - [x] Manual verification as per plan <!-- id: 15 -->
