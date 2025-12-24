# 🗺️ Project Roadmap & Agile Board

## 🚀 Current Sprint (Active)
**Goal:** Registration Flow & Attendee Management

- [x] **Data Model Updates** <!-- via Registration_Flow_Recommendation.md -->
    - [x] SQL: Make `persons.user_id` nullable.
    - [x] SQL: Add `is_pilot` to `event_ticket_types`.
    - [x] SQL: Add `is_pit_crew` and `ticket_code`.
- [x] **Registration Logic (API)**
    - [x] Upgrade `createOrder` to handle Pilot (Planes) & Crew (Linking).
    - [x] Update `getEventDetail` to expose `is_pilot` and `is_pit_crew`.
- [x] **Registration UI (Frontend)**
    - [x] Enhance `AttendeeModal` with dynamic forms (Pilot vs Crew vs Spectator).
    - [x] Implement Validations.

## 📋 Next Up (Ready for Dev)
- [ ] **Attendee Assignment Flow:** Allow users to view purchased tickets and assign names/emails after purchase.
- [ ] **Waiver System:** Digital waiver signing.
- [ ] **My Orders:** User profile view to see purchase history.

## 📦 Backlog (Future)
### Authentication & User Management
- [ ] **Email Confirmation:** Verify via SendGrid.
- [ ] **Social Login:** Google/Microsoft OAuth.
- [ ] **Role Management:** Admin UI.

### Operational Features
- [ ] **QR Code Generation:** For tickets.
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
