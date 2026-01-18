# Client Feedback Implementation Tasks

- [x] **General Navigation** <!-- id: gen_nav -->
    - [x] Implementation Plan Created (`Feedback_General_Navigation.md`)
    - [x] Frontend: Add "Information" Menu (Flightline, FAQ, Schedule placeholders)

- [x] **Admin Camping Enhancements** <!-- id: admin_camp -->
    - [x] Implementation Plan Created (`Feedback_Admin_Camping.md`)
    - [x] Frontend: Remove Suffix, Single Site Add, Map Re-upload
    - [x] API: Update handlers (`createCampsites`, `updateCampground`)

- [x] **Camping Pricing (Full Event)** <!-- id: camp_price -->
    - [x] Implementation Plan Created (`Feedback_Camping_Pricing.md`)
    - [x] API: Update `getCampgroundAvailability` (return `full_event_price`)
    - [x] API: Update `createOrder` (handle pricing logic)
    - [x] Frontend: Update `CampsiteModal` (display full event option)
    - [x] Frontend: Update `CampingPage` (Full Event logic and auto-check)
    - [x] Frontend: Admin Tool Updates (Set Full Event Price)

- [ ] **Pilot Features (Registration)** <!-- id: pilot -->
    - [x] Implementation Plan Created (`Feedback_Pilot_Features.md`)
    - [x] Schema: `planes.heavy_model_cert_image_url`, `attendees.has_agreed_to_mop` (Applied)
    - [x] Frontend: MOP Agreement Checkbox
    - [x] Frontend: Multi-plane list, Heavy Model Toggle, Cert Upload
    - [x] API: Handle new fields in `createOrder` & `updateAttendee`

- [x] **Ticket Description Field** <!-- id: ticket_desc -->
    - [x] Implementation Plan Created (`Feedback_Ticket_Description.md`)
    - [x] Schema: `event_ticket_types.description` (Check validity)
    - [x] Frontend: Add Input in Admin, Display in Shop

- [x] **Default Variants (Templates)** <!-- id: var_defaults -->
    - [x] Implementation Plan Created (`Feedback_Variant_Defaults.md`)
    - [x] Schema: `variant_templates` (Verify)
    - [x] Frontend: Template Manager
    - [x] API: Template CRUD

- [ ] **Legacy Booking / Priority** <!-- id: legacy -->
    - [x] Implementation Plan Created (`Feedback_Legacy_Booking.md`)
    - [ ] Research: Encryption/Matching logic
    - [ ] Execution: TBD

- [ ] **Square Integration** <!-- id: square_int -->
    - [x] Implementation Plan Created (`Square_Integration.md`) (Waiting for Approval)
    - [ ] Frontend: Install SDK & Add Payment Form
    - [ ] Backend: Install SDK & Update `createOrder`
    - [ ] Verification: Test Transaction
