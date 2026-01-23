# Subevent Variations Implementation

- [x] **Database Schema**
    - [x] Create `subevent_variations`, `subevent_variation_options`, `subevent_registration_choices` tables
    - [x] Execute SQL script (User confirmed)
- [x] **Backend Implementation**
    - [x] Update `getStoreItems.js`: Nest variations in response
    - [x] Update `createOrder.js`: Calculate price adjustments & save choices
- [x] **Frontend Implementation**
    - [x] Create `SubeventModal.jsx`: Selection UI
    - [x] Update `StorePage.jsx`: Integration of Modal & Cart Logic
    - [x] Update `Checkout.jsx`: Display selected options & Payload construction
- [ ] **Verification**
    - [ ] Manual test of flow
