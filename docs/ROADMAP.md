# 🗺️ Project Roadmap & Agile Board

## 🚀 Current Sprint (Active)
**Goal:** Registration Flow & Attendee Management

- [x] **Data Model Updates** <!-- via Registration_Flow_Recommendation.md -->
    - [x] SQL: Make `persons.user_id` nullable.
    - [x] SQL: Add `is_pilot` to `event_ticket_types`.
    - [x] SQL: Add `is_pit_crew` and `ticket_code`.
- [x] **Registration Logic (API)**
    - [x] Upgrade `createOrder.js` to handle Pilot (Planes) & Crew (Linking).
    - [x] Refactor `createOrder.js` for In-Cart Linking (Temp IDs).
    - [x] Update `getEventDetail` to expose `is_pilot` and `is_pit_crew`.
    - [x] Create `getUserEventAttendees` for previous pilot lookup.
- [x] **Registration UI (Frontend)**
    - [x] Enhance `AttendeeModal` with dynamic forms (Pilot vs Crew vs Spectator).
    - [x] Implement "Smart Pilot Selector" (In-Cart + Previous + Manual).
    - [x] Implement Validations.

## 📋 Next Up (Ready for Dev)
- [x] **QR Code Generation:** Display unique QR code for each ticket (for gate scanning).
- [/] **Campsite Booking:** Interactive map/list for booking camping spots (Backend & Admin Tool mostly done).
- [ ] **Merchandise Store:** E-commerce flow for pre-purchasing gear.

## 📦 Backlog (Future)
### Authentication & User Management
- [ ] **Email Confirmation:** Verify via SendGrid.
- [ ] **Social Login:** Google/Microsoft OAuth.
- [ ] **Role Management:** Admin UI.
- [ ] **Waiver System:** Digital waiver signing (Deferred).

### Operational Features
- [ ] **Mobile Scanning App:** Gate entry.

### Technical Debt / Polish
- [ ] **Refacto createOrder.js:** Split into `OrderService.js`.
- [ ] **Toast Notifications:** Replace alerts with toast library.
- [ ] **Loading Skeletons:** Better empty states.
- [ ] **Schema:** Add semantic keys for colors (`success_color`).

## 🏁 Completed (Recent)
- [x] **Public Events Module:** List and Detail views.
- [x] **Ticket Purchasing MVP:** Basic flow with mock payment.
- [x] **Authentication:** Login/Register.
