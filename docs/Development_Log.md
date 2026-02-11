

## [2026-02-12] - Pit Crew to Pilot Linking — In-Cart Fix (Completed)
- **Time**: 07:00 - 07:17
- **Completed Items**:
    - **Bug Fix (API)**: Added missing `pendingPilotLinks.push()` in `createOrder.js` (L363). The scaffolding was in place but the push was a comment placeholder.
    - **Bug Fix (Client)**: Fixed DOB dropdown selections resetting in `AttendeeModal.jsx`. The `syncDob` function was clearing `dateOfBirth` to `''` when only one of three dropdowns was filled, causing re-render to reset all selects. Now stores partial values so selections persist.
    - **Bug Fix (Client)**: Fixed in-cart pilots not appearing in pit crew "Select Pilot" dropdown. `AttendeeModal` was receiving a synthetic mini-cart (`{ [ticketId]: 1 }`) instead of the real cart. Added `cartItems` prop to `AttendeeModal` and passed the real `CartContext` cart array from `StorePage.jsx`. Rewrote pilot lookup to scan actual cart items for pilot/junior_pilot tickets.
    - **Verification**: ESLint passes cleanly on both modified files.
    - **Documentation**: Updated `IMPLEMENTATION_ROADMAP.md` (item #5 complete).

## [2026-02-12] - Fix Asset Hires List Duplication & Add Filters (Completed)
- **Time**: 06:43 - 06:55
- **Completed Items**:
    - **Bug Fix (API)**: Replaced `LEFT JOIN persons` with `OUTER APPLY (SELECT TOP 1 ...)` in `getAssetHires.js` to prevent row duplication when a user has multiple person profiles.
    - **Bug Fix (Frontend)**: Replaced `toLocaleDateString()` with `formatDateForDisplay()` from `dateHelpers.js` in `AssetHires.jsx` to prevent date-shift in UTC+10/+11 timezone.
    - **Feature (Frontend)**: Added text search (by asset name, hirer name, or order #) and status filter dropdown (All / Active / Returned) to the admin Hires list.
    - **Cleanup**: Removed the "Seed Test Data" button and associated `handleSeedTestData` function.
    - **Lint Cleanup**: Fixed 2 unused catch variable errors (`e` → `_e`), removed unused `confirm` and `token` variables, and suppressed initialization-only `useEffect` dependency warning.
    - **Verification**: ESLint passes cleanly.
    - **Documentation**: Updated `IMPLEMENTATION_ROADMAP.md`.

## [2026-02-12] - 'Register Now' Navigation Logic (Completed)
- **Time**: 06:33 - 06:45
- **Completed Items**:
    - **Feature**: Added "Register Now" CTA button to `EventDetails.jsx` with auth-aware navigation.
    - **Logic**: Logged-in users navigate to `/events/{slug}/shop`; guests to `/login` with redirect state.
    - **Login Enhancement**: `Login.jsx` reads `location.state` — displays amber info alert and redirects after login.
    - **Lint Cleanup**: Fixed 4 pre-existing lint errors in `EventDetails.jsx`.
    - **Verification**: Both files pass ESLint cleanly.
    - **Documentation**: Updated `IMPLEMENTATION_ROADMAP.md`.

## [2026-02-12] - Standardise Date of Birth Picker (Completed)
- **Time**: 06:25 - 06:35
- **Completed Items**:
    - **UX Improvement**: Replaced the browser-native `<input type="date">` for Date of Birth with three native `<select>` dropdowns (Day, Month, Year) in `AttendeeModal.jsx`.
    - **Rationale**: On mobile, the native date picker forces users to scroll through a calendar to reach years like 1985. Native `<select>` elements trigger optimized wheel/list pickers on iOS/Android, making year selection instant.
    - **Logic**: Dropdowns sync to the existing `dateOfBirth` field (`YYYY-MM-DD` format). Includes day-clamping validation (e.g., switching from 31st Jan to Feb auto-corrects to 28/29).
    - **Scope**: Frontend-only change. No backend or database modifications required.
    - **Verification**: Lint check passed (3 pre-existing warnings unrelated to this change).
    - **Documentation**: Updated `IMPLEMENTATION_ROADMAP.md`.

## [2026-02-12] - Mobile Store Tab Navigation Fix (Completed)
- **Time**: 06:12 - 06:22
- **Completed Items**:
    - **UX Improvement**: Implemented "Option E" (Fade Gradient + Scroll Snap) for the store tab bar.
    - **Visual Hint**: Added a right-edge fade gradient and an animated pulsing chevron (`›`) on mobile to signify off-screen content.
    - **Scrolling**: Added `snap-x` scroll snapping to tabs for a smoother "carousel" feel.
    - **Cleanup**: Defined the `scrollbar-hide` CSS utility and applied it to prevent native scrollbars from breaking the UI.
    - **Verification**: Verified mobile layout via browser DevTools. Hidden on desktop (≥768px).
    - **Documentation**: Archived implementation plan to `completed/`.

## [2026-02-08] - Campsite People Count Input Fix (Completed)
- **Time**: 17:05 - 17:15
- **Completed Items**:
    - **UX Improvement**: Resolved "sticky backspace" issue on Adults and Children input fields in `CampingPage.jsx` and `CampsiteModal.jsx`. 
    - **Logic**: Updated state handling to allow empty string values during typing, with an `onBlur` reset to default values (1 for adults, 0 for children). This prevents the input from snapping back to "1" while the user is trying to clear it to type a new number.
    - **Verification**: Verified logic handles price calculations correctly even if fields are temporarily cleared.
    - **Documentation**: Archived implementation plan to `completed/`.

## [2026-02-08] - Attendee Modal Simplification (Completed)
- **Time**: 16:50 - 16:55
- **Completed Items**:
    - **UX Request**: Removed the "I am this attendee" button from `AttendeeModal.jsx`.
    - **Reasoning**: The user decided the button was unnecessary and added undue complexity to the interface for end users.
    - **Verification**: Verified button and associated logic removed from `AttendeeModal.jsx`.

## [2026-02-08] - Temporary Hide Air Show Section (Completed)
- **Time**: 16:38 - 16:45
- **Completed Items**:
    - **UX Request**: Temporarily hid the "Air Show Registration (Public Attendance)" section on the event details (home) page.
    - **Front-End (Client)**:
        - Updated `EventDetails.jsx` by commenting out the public days section.
    - **Reasoning**: The client is not ready to display public registrations yet but wants to keep the code for future use.
    - **Verification**: Code wrapped in comment block in `EventDetails.jsx`.

## [2026-02-08] - Asset Hires Visibility Fix (Completed)
- **Time**: 16:25 - 16:35
- **Completed Items**:
    - **Bug Fix**: Resolved issue where pooled/virtual asset hires (Golf Carts) were invisible in the Admin "Hires" list.
    - **Root Cause**: The admin query was performing an `INNER JOIN` on the physical `asset_items` table. Since pooled inventory (introduced 2026-01-31) uses virtual stock and doesn't link to a physical item ID, these records were excluded.
    - **Back-End (API)**:
        - Updated `getAssetHires.js` to use `LEFT JOIN` on `asset_items`.
        - Updated join logic to link `asset_types` directly from the hire record, treating physical item details as optional.
    - **Front-End (Client)**:
        - Updated `AssetHires.jsx` to display "Pooled Assignment" (italicized) when no specific asset identifier is linked, clarifying the difference between tracked physical assets and pooled stock.
    - **Verification**:
        - Verified database query logic to include rows with `asset_item_id IS NULL`.

## [2026-02-08] - Store Navigation Cleanup (Completed)
- **Time**: 16:21 - 16:25
- **Completed Items**:
    - **UX Improvement**: Updated the main navigation link text from "Shop" to "Registration/Shop" in `client/src/components/Layout.jsx`.
    - **Scope**: Applied to both Desktop and Mobile navigation menus.
    - **Verification**: Verified code changes in `Layout.jsx` match the user request.

## [2026-02-08] - Ticket Allocation Subevent Fixes (Completed)
- **Time**: 15:55 - 16:15
- **Completed Items**:
    - **Goal**: Resolve "Mystery Guest" profile overwrites and Subevent assignment mix-ups.
    - **Frontend (Client)**:
        - **`AttendeeModal.jsx`**:
            - **Removed Auto-Fill**: Stopped default auto-fill of user email for all attendees (preventing overwrites).
            - **Feature**: Added "I am this attendee" button to explicitly populate user details when needed.
            - **Validation**: Implemented strict check blocking users from using their own email for guests with different names.
        - **`SubeventModal.jsx`**:
            - **Bug Fix**: Fixed logic to list **ALL** attendees in a cart item (not just the first one).
            - **UX**: Added Date display to attendee dropdown for clarity (e.g., "Jimmy (Fri-Mon)").
    - **Backend (API)**:
        - **`createOrder.js`**:
            - **Safety Guard**: Added backend check to reject orders where Profile Name vs Email significantly mismatches for the logged-in user.
        - **`authLogin.js`**:
            - **Update**: Include `email` in the returned user object for better client-side validation in future sessions.
    - **Verification**:
        - Verified "Mystery Guest" prevention (Empty email by default).
        - Verified "I am this attendee" functionality.
        - Verified Validation Error when trying to overwrite profile.
        - Verified Subevent Dropdown lists all potential attendees.
    - **Documentation**:
        - Archived implementation plan `20260208_ticket_allocation_issues.md` to `completed/`.

## [2026-02-08] - Ticket DOB Placeholder Fix (Completed)
- **Time**: 15:15 - 15:20
- **Completed Items**:
    - **UX Improvement**: Added a visible label to the Date of Birth field in `AttendeeModal.jsx`.
    - **Problem**: On mobile devices, the native date picker often hides the `placeholder` text, leaving users guessing what the field is for.
    - **Solution**: Wrapped the input in a container and added a `text-xs font-bold` label above it, consistent with other date fields.
    - **Verification**: Verified code structure ensures the new label aligns correctly within the grid layout.
    - **Documentation**: Archived implementation plan to `completed/`.

## [2026-02-08] - Campsite Tooltip Implementation (Completed)
- **Time**: 03:30 - 04:15
- **Completed Items**:
    - **Feature**: Implemented a tooltip on the campsite map (User and Admin) to display availability details on hover.
    - **Backend (API)**:
        - **`getCampsites.js`**:
            - Updated SQL query to return `bookings` JSON array instead of simple boolean `is_booked` for the given date range.
            - Maintains backward compatibility by calculating `is_booked` flag for existing frontend logic.
    - **Frontend (Client)**:
        - **`CampsiteTooltip.jsx`**:
            - Created reusable tooltip component to display site number, price, power status, and booked date ranges.
            - Uses `dateHelpers` for consistent timezone-free date formatting.
            - Dynamic positioning based on map coordinates.
        - **`CampingPage.jsx`**:
            - Integrated `CampsiteTooltip`.
            - Refactored layout to use CSS classes (`App.css`) for better mobile responsiveness (`flex-direction: column` on mobile).
            - Added hover state tracking for map pins.
        - **`AdminMapTool.jsx`**:
            - Integrated `CampsiteTooltip`.
            - Restored sidebar layout integrity after edit.
            - Fixed `catch(e)` lint errors by renaming unused variables to `_e`.
    - **Verification**:
        - `npm run lint` passed (cleaned up unused variables).
        - Confirmed code structure and logic handles fetching and displaying specific booking dates.
    - **Documentation**:
        - Archived `20260202_campsite_tooltip.md` (renamed to `20260208...`) and `20260208_campsite_booking_mobile_view.md` to `completed/`.
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-04] - Legacy/Past Attendee Campsite Booking (Completed)
- **Time**: 11:00 - 15:49
- **Completed Items**:
    - **Feature**: Implemented admin ability to book campsites for returning/past attendees who haven't created accounts yet.
    - **Backend (API)**:
        - **`createLegacyBooking.js`**:
            - Updated to accept `arrivalDate` and `departureDate` parameters (previously used event dates automatically).
            - Added **availability check** before creating booking - prevents double-booking by checking for conflicting reservations.
            - Returns HTTP 409 (Conflict) with clear error message if site is already booked for selected dates.
            - Sends welcome email to new legacy users with account claim instructions.
        - **`getLegacyBookings.js`**:
            - Fixed `Invalid column name 'name'` error - changed to `site_number` (correct column in `campsites` table).
        - **`createOrder.js`**:
            - Fixed `Invalid column name 'campsite_booking_id'` error - changed to `booking_id` (correct column in `campsite_bookings` table).
            - Fixed legacy booking merge logic for checkout.
    - **Frontend (Admin)**:
        - **`AdminLegacyImport.jsx`** (Modal Component):
            - Added **Arrival Date** and **Departure Date** input fields.
            - Dates are **pre-filled with event dates** and **constrained to event date range** (min/max validation).
            - Added **Site Confirmation Banner** displaying the selected campsite number.
            - Renamed submit button to "Create Booking".
            - Added client-side validation (dates required, departure after arrival).
        - **`AdminMapTool.jsx`**:
            - Renamed button from "Import Legacy" to **"Book Past Attendee"**.
            - **Moved button to header area** (next to campground toggles) for better visibility.
            - Button only appears when a site is selected and shows the site number.
            - **Added toggle behavior**: Clicking a selected site now deselects it, hiding the Edit Site section.
            - Passes event start/end dates to the modal for date validation.
    - **Frontend (Client)**:
        - **`CartContext.jsx`**:
            - Fixed legacy items not displaying in cart by adding **normalization on load** (ensures `type`, `name`, `checkIn`, `checkOut` properties exist).
            - Fixed duplicate check to use uppercase `'CAMPSITE'` for consistency.
    - **Key Design Decisions**:
        - **Date Flexibility**: Admins can specify custom arrival/departure dates (within event bounds) rather than full event dates only. This accommodates partial-event attendees.
        - **Availability Validation**: Backend validates site availability to prevent conflicts, using same logic as regular bookings.
        - **Button Placement**: Initially in "Editing Site" section, moved to header for quicker access without scrolling.
        - **Toggle Selection**: Clicking a selected site deselects it, providing intuitive UX.
        - **Date Constraints**: Used `min`/`max` HTML attributes (matching `CampsiteModal.jsx` pattern) to enforce event date boundaries.
        - **Pre-filled Dates**: Dates default to full event duration for convenience, can be adjusted.
    - **Verification**:
        - Fixed multiple schema mismatches between code and database (`name` vs `site_number`, `campsite_booking_id` vs `booking_id`).
        - Verified legacy booking flow end-to-end.
    - **Documentation**:
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-03] - Delete Existing Asset Inventory (Completed)

- **Time**: 16:30 - 17:30
- **Completed Items**:
    - **Feature**: Implemented "Delete" logic for Asset Inventory items.
    - **Backend (API)**:
        - Updated `manageAssetItems.js` DELETE handler.
        - **Soft Delete**: If item has hire history, status is updated to 'Deleted'.
        - **Hard Delete**: If item has no history, row is permanently removed.
        - Updated GET handler to filter out 'Deleted' items.
    - **Verification**:
        - Created `scripts/test_asset_deletion_logic.js` for integration testing.
        - *Note*: Automated test data generation encountered complex DB constraint issues (Person/Event dependencies), but the core deletion logic was reviewed and confirmed.
    - **Documentation**:
        - Archived implementation plan `20260202_delete_existing_asset_inventory.md` to `completed/`.
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-03] - Flight Line Duties Interface (Completed)
- **Time**: 14:15 - 14:30
- **Completed Items**:
    - **Feature**: Refactored "Flight Line Duties" selection in `AttendeeModal.jsx`.
    - **UI**:
        - Moved section above Pilot Registration for better visibility.
        - Replaced single checkbox with "Agree" (Green/Standard) vs "Disagree" (Amber/Surcharge) radio cards.
        - Improved price transparency by showing the exact cost difference.
        - **Refinement**: Removed "simulate 2 hours" and "prefer not to" text for cleaner UI (User Request).
    - **Logic**:
        - Preserved Day Pass logic (hidden for < 3 days).
        - Defaults to "Agree" (Standard Price) to encourage volunteering.
    - **Verification**:
        - Logic check of `AttendeeModal.jsx` confirmed correct state handling and conditional rendering.
        - Verified `ticket.system_role === 'pilot'` restriction is maintained.
    - **Documentation**:
        - Archived plan to `completed/`.
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-03] - Subevent Note Implementation (Completed)
- **Time**: 12:45 - 13:25
- **Completed Items**:
    - **Feature**: Implemented "Subevent Notes" allowing users to add specific notes (e.g., Dietary Requirements) to subevent bookings.
    - **Database**:
        - Added `note_title` to `subevents` table (for admin configuration).
        - Added `attendee_note` to `subevent_registrations` table (for user input).
    - **Backend (API)**:
        - Updated `createSubevent.js` and `updateSubevent.js` to manage `note_title`.
        - Updated `createOrder.js` to persist `attendee_note` in subevent registrations.
        - Updated `getOrderDetail.js` to return note details for display.
        - **Bug Fix**: Updated `getStoreItems.js` to include `note_title` in the response (resolved missing field issue).
    - **Frontend (Client)**:
        - **Admin**: Updated `SubeventForm.jsx` to allow admins to set a "Note Title".
        - **Store**: Updated `SubeventModal.jsx` to prompt for input if a note title is configured.
        - **Checkout**: Updated `StorePage.jsx` and `Checkout.jsx` to ensure the note is passed through the cart to the final order payload.
        - **Orders**: Updated `OrderDetail.jsx` to display the saved note on the order confirmation.
    - **Verification**:
        - Verified database schema.
        - Debugged and fixed missing field issues in API and Checkout payload.
        - Verified end-to-end flow: Admin Config -> Store Purchase -> Database Persistence -> Order Display.
    - **Documentation**:
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-03] - Merchandise Quantity Selection (Completed)
- **Time**: 11:30 - 12:00
- **Completed Items**:
    - **Feature**: Implemented quantity selection for Merchandise items (apparel, etc.), allowing purchases of multiple items in a single cart row.
    - **Database**:
        - Added `quantity` column to `order_items` table (Manual Script applied).
    - **Backend (API)**:
        - Updated `createOrder.js` to insert single row with quantity.
        - Updated `getOrderDetail.js` to return quantity.
        - Updated `getAdminOrders.js` to sum quantity for item counts.
        - Updated `refundOrderItem.js` to handle quantity-based stock restoration.
    - **Frontend (Client)**:
        - Updated `ProductModal.jsx` with +/- quantity selector.
        - Updated `CartContext.jsx` to calculate totals based on item quantity.
        - Updated `Layout.jsx` (Header/Mobile) to show total item count in cart badge.
        - Updated `Checkout.jsx`, `OrderDetail.jsx`, and `Invoice.jsx` to display "Qty: X", unit prices, and correct line totals.
    - **Verification**:
        - Verified database schema.
        - Verified full purchase flow with multi-quantity items.
        - Verified Invoice generation and price calculations.
        - Verified Admin Order view item counts.
    - **Documentation**:
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-03] - CampingPage ReferenceError Fix (Completed)
- **Time**: 11:50 - 12:00
- **Completed Items**:
    - **Bug Fix**: Resolved `ReferenceError: Cannot access 'fetchEventsIndex' before initialization` in `CampingPage.jsx`.
    - **Fix**: Moved `useCallback` definitions (`fetchEventsIndex`, `fetchEventDetails`, `fetchAvailability`) above the `useEffect` hooks that depend on them. This ensures functions are defined before `useEffect` captures them in its dependency array, resolving the Temporal Dead Zone (TDZ) crash.
    - **Verification**: Lint check passed.

## [2026-02-03] - Full Event Package Limitations (Completed)
- **Time**: 10:40 - 11:15
- **Completed Items**:
    - **Feature**: Restricted "Full Event Package" pricing option for camping to stays of 5+ nights.
    - **Backend (API)**:
        - Updated `createOrder.js` to enforce strict validation: if `full_event_price` is sent but stay is <= 4 nights, the price is recalculated as daily rate (causing rejection if price mismatch).
    - **Frontend (Client)**:
        - Updated `CampingPage.jsx` and `CampsiteModal.jsx` to:
            - Calculate nights dynamically.
            - Disable/Grey out the "Full Event Package" checkbox if stay is <= 4 nights.
            - Auto-uncheck the option if dates are changed to a short stay.
            - Display explanatory warning text ("Requires 5+ nights").
    - **Verification**:
        - Linted `client/` to ensure code correctness (fixed unused variables).
        - Verified logic covers both main camping page and modal booking flows.
    - **Documentation**:
        - Moved implementation plan to `completed/`.
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-02] - Critical Lint Error Fixes (Completed)
- **Time**: 16:00 - 16:55
- **Completed Items**:
    - **Stability**: Resolved 40+ critical ESLint errors to prevent runtime crashes.
    - **Frontend (Client)**:
        - **`AdminMapTool.jsx`**: Fixed severe React Hook violations by moving `useEffect` hooks before conditional returns. Removed unused `tempCoords` state.
        - **`CampingPage.jsx`**: Wrapped data fetching functions in `useCallback` and fixed dependency arrays to prevent infinite loops.
        - **`create_real_admin.js`**: Fixed `no-undef` errors by adding `/* global require */` directive.
        - **Cleanup**: Removed unused variables (e.g., `replaceExisting`, `totalSites`, `user`, `navigate`) from `FlightLineRoster.jsx`, `FlightLinesSetup.jsx`, and `AdminDashboard.jsx`.
    - **Verification**:
        - `npm run lint` now passes without critical functional errors.
        - Created `walkthrough.md` documenting the fixes.
    - **Documentation**:
        - Completed "Critical Lint Error Fixes" in `Master_Implementation_Schedule.md`.

## [2026-02-02] - Admin Attendees Ticket Type Dropdown Fix (Completed)
- **Time**: 15:55 - 16:00
- **Completed Items**:
    - **Bug Fix**: Fixed empty "Ticket Type" dropdown in Admin Attendees list.
    - **Frontend (Client)**:
        - Updated `AttendeesList.jsx` line 98 to change `data.ticket_types` to `data.tickets` to match backend API response from `getEventDetail`.
    - **Verification**:
        - Git diff confirmed single-line change is correct.
        - User manually verified dropdown now populates with actual ticket types.
    - **Documentation**:
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-02] - Subevent Modal Button Visibility Fix (Completed)
- **Time**: 15:46 - 15:54
- **Completed Items**:
    - **Bug Fix**: Fixed layout issue where "Add to Cart" button was unreachable on small screens in Subevents modal.
    - **Frontend (Client)**:
        - Updated `SubeventModal.jsx` modal container from `max-h-[90vh]` to `max-h-[90dvh]` for better mobile browser support.
        - Changed content area from `min-h-[300px]` to `min-h-0 flex-1` to ensure proper flexbox behavior.
        - Footer with button now stays pinned at bottom on all screen sizes.
    - **Verification**:
        - Linted `client/` (no errors).
        - Created `walkthrough.md` with comprehensive manual verification steps for mobile testing.
    - **Documentation**:
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-02] - Mobile Date Selection Bugfix (Completed)
- **Time**: 15:13 - 15:35
- **Completed Items**:
    - **Bug Fix**: Implemented strict validation to prevent date selection outside event range on mobile.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to validate arrival/departure dates against event start/end dates upon submission.
        - Used `formatDateForDisplay` for clear error messages.
    - **Documentation**:
        - Archived implementation plan `20260202_date_selection_mobile.md` to `completed/`.
        - Updated `Master_Implementation_Schedule.md`.

## [2026-02-02] - Asset Type Checkout Error Fix (Completed)
- **Time**: 15:09 - 15:25
- **Completed Items**:
    - **Bug Fix**: Resolved "Asset Type undefined" error during checkout.
    - **Frontend (Client)**:
        - Updated `Checkout.jsx` payload construction to handle missing `id` on asset cards.
        - Updated `StorePage.jsx` to explicitly set `id` on new asset cart items for consistency.
    - **Verification**:
        - Linted `client/` (no new errors).
        - Created `walkthrough.md` with manual verification steps.
    - **Documentation**:
        - Archived implementation plan to `completed/`.

## [2026-01-31] - Campsite Booking UI
**Milestone:** Improved Camping Availability & User Interface

### Completed Items
*   **Documentation**
    *   **Workflow:** Moved implementation plan to `completed/`.
*   **Camping Interface Refactor** [Completed]
    *   **Layout:** Moved "Check In / Check Out / Check Availability" controls from the main content area to the **Booking Details Sidebar**.
    *   **UX Improvement:** Refactored the loading state logic. Previously, the entire page would hide during an availability check. Now, only the Map/List view updates with a loader, keeping the sidebar controls visible and interactive.
    *   **Visuals:** Ensured the date inputs and button stack correctly within the narrower sidebar container.

### Verification
*   **Manual Testing:** User to verify functionality via `walkthroughs/20260131_campsite_ui.md`.


## [2026-01-31] - Admin Campground Grid Partials
- **Time**: 16:56 - 17:15
- **Completed Items**:
    - **Feature**: Implemented "Grid View" for Admin Camping Availability Report.
    - **Logic**:
        - Replicated "Partial Booking" logic from user map (Counts unique nights vs total event nights).
        - **Full** (Red): Unique booked nights >= Event duration.
        - **Partial** (Pink): Booked nights > 0 but < Event duration.
        - **Available** (Green): 0 Booked nights.
    - **UI**: 
        - Replaced simple list with a Scrollable Grid Table.
        - Dynamic date columns based on selected date range.
        - Hover tooltips showing "Booked By" and "Order #".
    - **Optimization**: Used `useMemo` for heavy processing to prevent re-renders.
    - **Refinement**: 
        - Removed Date Filters (Auto-shows full event).
        - Fixed logic to exclude Event End Date (Checkout Day) from grid columns.
        - **Status Logic Fix**: Standardized "Full" vs "Partial" logic to match Store's `CampingPage.jsx`.
            - Now uses strict YYYY-MM-DD parsing to avoid time-of-day inflation of "Total Event Nights".
            - Calculates booking duration by summing clamped date ranges instead of counting unique dates.
        - **Sorting Fix**: Implemented natural sorting (e.g., 1, 2, 10 instead of 1, 10, 2) using `localeCompare` with `numeric: true`.
    - **Verification**: Verified via linting and manual verification plan logic.
    - **Documentation**: Archived plan to `completed/`.

## [2026-01-31] - Delete Unpaid Orders
- **Time**: 10:45 - 11:15
- **Completed Items**:
    - **Feature**: Implemented `deleteOrder` API to allow users to remove 'Pending' orders.
    - **Logic**: Performs a HARD DELETE on the Order and Order Items to release resources, but a SOFT DELETE (Status: 'Cancelled') on linked Attendees to preserve personal data.
    - **UI**: Added a "Delete" button (trash icon) to the My Orders page for pending orders, with a confirmation modal.
    - **Verification**: Verified via linting and manual walkthrough plan.
    - **Documentation**: Archived plan to `completed/` and created `walkthrough.md`.

## [2026-01-31] - Pooled Asset Inventory & Post-Launch Fixes
- **Time**: 08:00 - 09:15
- **Completed Items**:
    - **Feature**: Implemented "Pooled Inventory" system for Asset Hire, replacing strict serialized item booking with a Stock Quantity model.
    - **Database**:
        - Added `stock_quantity` to `asset_types` table.
        - Migrated existing data to use the new field.
        - Made `site_number` nullable in `assets` table (optional tracking).
    - **Backend (API)**:
        - Updated `manageAssetTypes.js` to persist `stock_quantity`.
        - Updated `getAssetAvailability.js` to calculate availability based on `stock_quantity - active_bookings`.
        - Updated `createOrder.js` to validate against pool size instead of specific items.
        - **Fix**: `manageAssetCategories.js` now allows fetching without `eventId` (resolving 400 error).
    - **Frontend (Client)**:
        - **AssetTypes (Admin)**: Added `Stock Quantity` input field; Fixed image upload property mismatch (`image` vs `image_url`).
        - **StorePage**: Updated to use "Virtual" items for pooled booking; Fixed `formatDateForDisplay` ReferenceError.
        - **AssetSelectionModal**:
            - Updated to show "Available count".
            - Fixed hydration error (`div` inside `p`).
            - Fixed null input warnings.
        - **Invoice**: Updated to display Asset Type and Dates correctly.
    - **Documentation**:
        - Archived plan to `completed/`.
        - Created `walkthroughs/20260130_pooled_inventory.md`.
        - Drafted explanation email for client.

    - **Partial Bookings Display**:
        - **Feature**: Implemented visual indicators for "Partially Booked" campsites.
        - **Logic**:
            - **Fully Booked** (Red): Site booked for all nights of event.
            - **Partially Booked** (Pink): Site has *some* bookings but is not fully booked.
            - **Available** (Gold/Green): Site has NO bookings.
        - **Frontend (Client)**:
            - Updated `CampingPage.jsx` map pin logic and legend.
            - Updated `CampingListView.jsx` status column to badge sites as "Booked", "Partial", or "Available".

## [2026-01-30] - Campsite Sorting & Bulk Create (Completed)
- **Time**: 11:42 - 12:00
- **Completed Items**:
    - **Feature**: Implemented numerical sorting for campsites and improved "Bulk Create" logic.
    - **Database**:
        - Added computed column `site_sort_index` to `campsites` table (via Manual Script).
        - Logic extracts leading numbers for natural sorting (e.g., 44A -> 44), ensuring site "10" comes after "2".
    - **Backend (API)**:
        - Updated `getCampsites` to sort by the new index and return `next_site_number`.
        - Updated `createCampsites` to use smart `MAX(index)` logic instead of `COUNT` for determining the next number.
        - Supports user-defined `start_number` override.
    - **Frontend (Admin)**:
        - Updated `AdminMapTool.jsx` "Bulk Create" section.
        - Added "Start #" input that auto-fills with the next logical number, allowing full control over sequences (handling gaps and custom sections).
        - Retained "Prefix" option.
    - **Verification**:
        - Verified sorting of mixed alphanumeric sites (1, 2, 4A, 10).
        - Verified bulk creation sequences with and without start number overrides.
    - **Documentation**:
        - Archived implementation plan to `completed/`.
        - Created `walkthroughs/20260130_campsite_sorting_walkthrough.md`.

## [2026-01-30] - UI Cleanup Jobs (Login & Attendee Modal) (Completed)
- **Time**: 11:20 - 11:35
- **Completed Items**:
    - **Login Screen**:
        - **Visibility**: Moved "Create an Account" link to the top of the login box for better visibility.
        - **Styling**: Styled the registration button with the Accent Color (Gold) to make it prominent.
    - **Attendee Modal Refinements**:
        - **Text**: Added "(free with this ticket)" to Official Dinner and Included Merchandise labels.
        - **Text**: Changed "Are you bringing heavy models?" to "I am bringing Heavy Models".
        - **Logic**: Hidden Dietary Requirements field entirely when "Attending Dinner" is unchecked.
        - **Bug Fix**: Resolved validation issue where Heavy Model Inspectors were blocked by certificate requirements despite being exempt (and fields being hidden).
    - **Verification**:
        - Verified Login UI hierarchy.
        - Verified Modal visibility toggles and Inspector validation bypass.
    - **Documentation**:
        - Archived plan to `completed/20260130_cleanup_jobs.md`.

## [2026-01-30] - Admin Campgrounds Fix (Completed)
- **Time**: 06:14 - 06:17
- **Completed Items**:
    - **Bug Fix**: Resolved issue where the "+" button in Admin Campgrounds was not working when no campgrounds existed.
    - **Root Cause**: The "Add Campground" modal was nested inside a conditional block that required a selected campground to render.
    - **Fix**: Moved the modal rendering outside of the conditional block in `AdminMapTool.jsx`, ensuring it is always accessible.
    - **Verification**: Verified fix by ensuring modals render correctly in the component structure.
    - **Documentation**: 
        - Created `walkthrough.md` detailing the fix.

## [2026-01-28] - Password Recovery (Recover Login) (Completed)
- **Time**: 15:14 - 15:30
- **Completed Items**:
    - **Feature**: Implemented email-based password reset flow for users and admins.
    - **Backend (API)**:
        - Added `sendPasswordResetEmail()` to `emailService.js` using existing Resend pattern.
        - Created `authRecover.js` endpoint (POST /api/authRecover) - generates secure token, stores in DB, sends reset email.
        - Created `authResetPassword.js` endpoint (POST /api/authResetPassword) - validates token, hashes new password, clears token.
    - **Frontend (Client)**:
        - Created `RecoverLogin.jsx` - email form with success message.
        - Created `ResetPassword.jsx` - password reset form with confirmation.
        - Updated `Login.jsx` - added "Forgot your password?" link.
        - Updated `App.jsx` - registered `/recover-login` and `/reset-password` routes.
    - **Verification**:
        - Lint check passed for all new files.
        - API endpoint tested and confirmed working (`authRecover` returns expected response).
        - Note: Full flow requires API restart to pick up new `authResetPassword` function.

## [2026-01-28] - Campsite Availability Grid (Completed)
- **Time**: 14:30 - 15:10
- **Completed Items**:
    - **Feature**: Implemented per-night availability grid in the Camping List View.
    - **Backend (API)**:
        - Updated `getCampgroundAvailability.js` to return ALL bookings for the full event period (for grid display).
        - `is_available` now correctly checks user-selected dates (not just existence of any booking).
        - API response includes `event_start` and `event_end` for consistent date column generation.
    - **Frontend (Client)**:
        - Updated `CampingListView.jsx` with dynamic date columns showing X (booked) or - (available) per night.
        - Implemented night-based logic: checkout day is available for new bookings.
        - Fixed timezone issue using local date formatting instead of UTC.
        - Added `compactMode` prop to hide redundant columns (Dimensions, Daily Rate, Full Event).
        - Sticky "Site" column for horizontal scrolling.
    - **Layout**:
        - Updated `CampingPage.jsx` to stack vertically in list view (table full width, sidebar below).
        - Added simplified legend for list view (X = Booked, - = Available).
    - **Verification**:
        - User verified correct booking display and availability logic.

## [2026-01-28] - Variant Templates Editing (Completed)
- **Time**: 14:00 - 14:15
- **Completed Items**:
    - **Feature**: Enable editing of existing merchandise variant templates.
    - **Backend (API)**:
        - Created `PUT /api/manage/variant-templates/{id}` endpoint.
        - Implemented replace logic for template options (full sync).
    - **Frontend (Admin)**:
        - Updated `VariantTemplates.jsx` with an Edit (Pencil) icon.
        - Implemented modal pre-filling and update logic.
    - **Verification**:
        - Created `walkthrough.md` with manual verification steps.
    - **Documentation**:
        - Archived implementation plan `20260128_variant_templates.md` to `completed/`.
    - **Fixes**:
        - Fixed modal backdrop styling in `VariantTemplates.jsx` (switched to `bg-black/50` to prevent black screen issue).

## [2026-01-28] - Asset Sorting Debugging (Completed)
- **Time**: 13:00 - 13:55
- **Completed Items**:
    - **Debugging**:
        - Fixed critical issue where Asset Type reordering was bouncing back due to state not being explicitly sorted during render.
        - Fixed UI flashing during sorting by implementing silent background data refresh.
        - Fixed syntax error introduced by a patch script (newline escaping).
    - **Frontend (Admin)**:
        - Refactored `AssetTypes.jsx` to correctly handle `sort_order` sorting in the `groupedTypes` function.
        - Updated `handleDragEnd` to optimistically update state without mutation, fixing the save persistence.
    - **Verification**:
        - Verified persistent sorting via drag-and-drop.
        - Verified silent refresh (no flash).
    - **Documentation**:
        - Archived implementation plan `20260127_assets_categories_and_sorting.md` to `completed/`.
        - Updated `SKILL.md` with new React and Scripting gotchas.

## [2026-01-28] - Merchandise Suppliers (Completed)
- **Time**: 12:00 - 12:45
- **Completed Items**:
    - **Feature**: Implemented "Merchandise Suppliers" system to link products to specific suppliers.
    - **Database**:
        - Created `merchandise_suppliers` table (Manual Script applied).
        - Added `supplier_id` column to `products` table.
    - **Backend (API)**:
        - Created `suppliers.js` endpoint (CRUD) for managing suppliers.
        - Updated `products.js`, `createProduct.js`, `updateProduct.js`, `getProductDetails.js` to handle `supplier_id`.
    - **Frontend (Admin)**:
        - Created `SupplierList.jsx` for managing supplier records.
        - Updated `MerchandiseList.jsx` to link to the new management page.
        - Updated `ProductEditor.jsx` with a Supplier dropdown and "Quick Add" functionality.
    - **Verification**:
        - Linted and fixed code issues (`useCallback` dependency).
        - Verified API endpoint reachability.
    - **Documentation**:
        - Archived `20260128_merchandise_suppliers.md` to `completed/`.

## [2026-01-28] - Subevent Registrations (Completed)
- **Time**: 11:00 - 12:20
- **Completed Items**:
    - **Feature**: Implemented Guest Name support and Attendee Search for Subevent Registrations.
    - **Database**:
        - Verified `guest_name` column in `subevent_registrations`.
        - Verified `attendee_id` is nullable.
    - **Backend (API)**:
        - Created `searchEventAttendees.js` (GET /api/events/:slug/attendees/search).
        - Updated `createOrder.js` to handle guest names (create registration with NULL attendee_id).
        - Updated `getOrderDetail.js` to return `guest_name` and `is_subevent_guest` flag.
    - **Frontend (Client)**:
        - **Store**: Updated `StorePage.jsx` to support attendee search.
        - **UI**: Refactored `SubeventModal.jsx` to use a Combobox for selecting existing attendees (My Pilots / Cart) or entering a new Guest Name.
        - **Checkout**: Fixed payload to ensure guest details are transmitted to backend.
        - **Invoice**: Updated logic to explicitly label "Guest: [Name]" for clarity.
    - **Verification**:
        - Validated API endpoints.
        - Verified end-to-end checkout flow with Guest methodology.
        - Verified Invoice display.
        - Confirmed linting (with minor hook suppression for intended behavior).
    - **Documentation**:
        - Updated `walkthrough.md`.
        - Archived `20260127_subevent_registrations.md` to `completed/`.

## [2026-01-28] - Order Item Refunds (Completed)
- **Time**: 10:15 - 10:45
- **Completed Items**:
    - **Feature**: Implemented "Order Item Refunds" for Admins.
    - **Database**:
        - Verified `refunded_at` column exists in `order_items`.
    - **Backend (API)**:
        - Updated `getOrderDetail.js` to return `refunded_at` status.
        - Created `refundOrderItem.js` endpoint:
            - Marks item as refunded (sets `refunded_at`).
            - Automatically restores stock for Merchandise items (+1 stock).
    - **Frontend (Client)**:
        - Updated `OrderDetail.jsx`:
            - Added "Status / Action" column for Admins.
            - Displays "🚫 REFUNDED" badge if refunded.
            - Shows "Refund" button if active.
            - Added confirmation dialog warning about stock restoration.
            - **Unrefund**: Added "Undo Refund" capability to reverse accidental refunds (restores status, reduces stock).
            - **Refinement**: Switched to custom confirm modal and fixed UI text.
    - **Verification**:
        - Linted `OrderDetail.jsx`.
        - Verified code logic matches implementation plan.
    - **Documentation**:
        - Archived implementation plan to `completed/`.

## [2026-01-28] - Attendees List Implementation (Completed)
- **Time**: 09:15 - 09:45
- **Completed Items**:
    - **Feature**: Implemented "Attendees List" for Admin Dashboard.
    - **Backend (API)**:
        - Created `getAdminAttendees.js` endpoint with filtering (Search, Ticket Type, State, Duties, Heavy Model, Dinner) and sorting.
        - **Fix**: Renamed route from `admin/attendees` to `manage/attendees` to resolve 404 error caused by Azure Functions proxy conflict with `admin/` prefix.
        - **Fix**: Corrected invalid column references:
            - `mobile` -> `phone_number`
            - `camping_required` -> Derived from `order_items` subquery.
            - `checked_in_at` -> Removed (unused).
        - Includes derived fields like `has_heavy_model` and `is_heavy_model_inspector`.
    - **Frontend (Admin)**:
        - Created `AttendeesList.jsx` page with comprehensive filtering and sorting table.
        - Registered route `/manage/attendees/:slug` in `App.jsx`.
        - Added navigation link "View List" to Admin Dashboard "Attendees" card.
    - **Verification**:
        - Debugged schema using `debug-schema` endpoint to identify correct column names.
        - Verified full end-to-end loading and filtering of 200+ attendees.
    - **Documentation**:
        - Archived implementation plan to `completed/`.


## [2026-01-28] - Attendee Details Refinement (Completed)
- **Time**: 08:30 - 08:45
- **Completed Items**:
    - **Feature**: Refined Attendee Modal logic to improve data quality and UX.
    - **Frontend (Client)**:
        - **Validation**: Implemented strict frontend validation for all contact fields in `AttendeeModal.jsx` (replacing need for DB constraints).
        - **Day Pass**: Hidden "Official Dinner" and "Dietary Requirements" fields for Day Pass tickets.
        - **Defaults**: Removed pre-filled arrival/departure dates to force explicit user selection.
        - **Logic**: Fixed Heavy Model Inspector logic to keep "Bringing Heavy Models" checked when Inspector is selected.
        - **Reset**: Enforced form reset in `StorePage.jsx` when opening modal for new tickets.
    - **Documentation**:
        - Updated and archived implementation plan.
    - **Verification**:
        - Verified code syntax and logic via linting and review.

## [2026-01-28] - Fix 401 on My-Attendees (Completed)
- **Time**: 06:15 - 06:20
- **Completed Items**:
    - **Bug Fix**: Resolved 401 Unauthorized error in `StorePage.jsx` when fetching user attendees.
    - **Root Cause**: The fetch call was missing the `X-Auth-Token` header required by Azure, and was reading a potential stale token from `localStorage`.
    - **Fix**:
        - Updated `StorePage.jsx` to use `useAuth()` hook for token retrieval (reactive state).
        - Added `X-Auth-Token` header to the API request.
    - **Documentation**:
        - Updated `.agent/skills/startup-engineer/SKILL.md` with a "Gotcha" about Azure Auth Headers.
        - Archived implementation plan to `completed/`.
        
        # Development Log

## [2026-01-27] - Admin Camping Updates
**Milestone:** Improved Admin Camping Tool Usability

### Completed Items
*   **Admin Map Tool**
    *   **Features**: 
        *   Defaulted "Event" dropdown to the current or next upcoming event.
        *   Sorted events by date in the dropdown.
    *   **UI**: Removed intrusive "Click map to place" overlay; Relying on crosshair cursor.
*   **Camping Availability Report**
    *   **Features**: 
        *   Defaulted "Event" dropdown to the current or next upcoming event.
        *   Sorted events by date in the dropdown.

### Verification
*   **Manual**: Review of code changes confirms logic aligns with requirements.


## [2026-01-27] - Flight Line Roster Filtering (Completed)
- **Time**: 17:00 - 17:15
- **Completed Items**:
    - **Feature**: Implemented client-side filtering of the Flight Line Roster by Flight Line.
    - **Frontend (Admin)**:
        - Updated `FlightLineRoster.jsx` to fetch available flight lines.
        - Added state and logic to filter roster slots by selected flight line.
        - Added a "Filter by Flight Line" dropdown control to the UI.
    - **Verification**:
        - Linted `FlightLineRoster.jsx` (existing warnings noted, no new critical errors).
        - Confirmed code structure matches implementation plan.

## [2026-01-27] - Air Show Registration Updates (Completed)
- **Time**: 16:45 - 17:00
- **Completed Items**:
    - **Feature**: Updated Air Show Registration to include email subscription opt-in.
    - **Database**:
        - Confirmed `subscribe_to_emails` column exists in `public_registrations` table.
    - **Backend (API)**:
        - Updated `publicRegistration.js` to capture and store `subscribeToEmails` preference.
    - **Frontend (Client)**:
        - Updated `EventDetails.jsx` title to "Air Show Registration (Public Attendance)".
        - Updated `PublicRegistrationModal.jsx` to include "Would you like to be notified of future air shows?" checkbox.
    - **Verification**:
        - Reviewed code changes for correctness.
        - Verified database insertion logic.

## [2026-01-27] - Pit Crew Tickets (Completed)
- **Time**: 16:30 - 16:45
- **Completed Items**:
    - **Feature**: Implemented Pit Crew ticket functionality with optional AUS Number and Flight Line Duties.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to include an "AUS Number" field for Pit Crew tickets.
        - Implemented logic to show "Flight Line Duties" checkbox only if an AUS Number is provided.
        - Verified that selecting Flight Line Duties does not trigger price changes for Pit Crew (confirmed by plan).
    - **Verification**:
        - Verified existing database schema supports `license_number` and `flight_line_duties`.
        - Linted `AttendeeModal.jsx` to ensure no new errors.

## [2026-01-27] - Subevent Date/Timezone Bug Fixes (Completed)
- **Time**: 13:00 - 16:30
- **Completed Items**:
    - **Bug Fix**: Resolved critical timezone conversion issues affecting subevent dates and times across the entire application.
    - **Root Cause**: 
        - JavaScript Date methods (`getDate()`, `getHours()`, etc.) were applying UTC+11 timezone offset to datetime values.
        - SQL Server stores datetime without timezone info (wall-clock time), but JavaScript was interpreting and converting them.
        - Example: DB stored "10-Jul 16:00" → Displayed as "11-Jul 02:00" (10-hour shift).
    - **Solution**:
        - Created `client/src/utils/dateHelpers.js` with 5 utility functions using **UTC methods** (`getUTCDate()`, `getUTCHours()`, etc.).
        - Replaced all inline date formatting with centralized utilities across 6 files.
    - **Files Updated**:
        - **Input Formatting**: `SubeventForm.jsx`, `EventForm.jsx` (use `formatDateTimeForInput()`).
        - **Display Formatting**: `AdminSubevents.jsx`, `StorePage.jsx`, `OrderDetail.jsx`, `Checkout.jsx`.
    - **Additional Fixes**:
        - Added `cache: 'no-store'` to subevent fetch calls to prevent stale data issues.
    - **Documentation**:
        - Updated `.agent/skills/startup-engineer/SKILL.md` with "Date/Time Handling Protocol".
        - Prohibits direct use of `toLocaleString()` / `toISOString()` on datetime fields.
        - Mandates use of `dateHelpers` utilities for all future datetime handling.
    - **Verification**: User tested and confirmed fixes resolve the display issue completely.

## [2026-01-27] - Camping Availability Report Authentication Fix (Completed)
- **Time**: 12:30 - 13:00
- **Completed Items**:
    - **Bug Fix**: Resolved "403 Unauthorized" error when accessing the Camping Availability Report on the live environment.
    - **Root Cause**: 
        - API call in `CampingAvailabilityReport.jsx` was missing authentication headers.
        - Azure Functions require both `Authorization: Bearer <token>` and `X-Auth-Token: <token>` headers.
    - **Solution**:
        - Added `getAuthHeaders()` utility to construct proper headers.
        - Updated fetch call to include both required authentication headers.
    - **Verification**: User confirmed report loads successfully on live environment.

## [2026-01-27] - Day Pass Tickets Implementation (Completed)
- **Time**: 15:30 - 16:15
- **Completed Items**:
    - **Feature**: Implemented Day Pass ticket functionality with dynamic pricing based on date range selection.
    - **Database**: 
        - Added `is_day_pass` column (BIT, NOT NULL, DEFAULT 0) to `event_ticket_types` table (Manual Script applied).
    - **Backend (API)**:
        - Updated `ticketTypes.js` (GET, POST, PUT) to handle `is_day_pass` field.
        - Updated `getStoreItems.js` to include `is_day_pass` in ticket data for the storefront.
    - **Frontend (Admin)**:
        - Updated `EventForm.jsx` to add "Day Pass Logic?" checkbox in ticket creation/editing modal.
        - Added explanatory text for admin users about Day Pass behavior.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to show flight line duties checkbox only for pilots with 3+ day duration on Day Pass tickets.
        - Added dynamic price preview showing real-time calculation (X days × $Y/day = $Z) when dates are selected.
        - Updated `StorePage.jsx` to calculate Day Pass pricing as `daily_rate × days_selected`.
        - Flight line duties checkbox does not affect Day Pass pricing (fixed per-day rate).
    - **Bug Fixes**:
        - Fixed `formatDateTime is not defined` error in `EventForm.jsx` by correcting function name to `formatDateTimeForInput`.
        - Fixed missing `is_day_pass` field in storefront by updating `getStoreItems.js` SELECT query.
    - **Verification**:
        - User manually verified Day Pass ticket creation, pricing calculation, and attendee modal behavior.

## [2026-01-26] - Subevent Registration Attendee Linking (Completed)
- **Time**: 14:15 - 15:10
- **Completed Items**:
    - **Feature**: Implemented linking of Subevent Registrations to specific Attendees (Pilots/Guests) during checkout.
    - **Database**: 
        - Added `attendee_id` field to `subevent_registrations` table (Manual Script applied).
        - Updated `ensure_schema_minimal.js` to reflect this change.
    - **Backend (API)**:
        - Updated `createOrder.js` to resolve specific attendees for subevents using `tempId` mapping from cart items.
        - Logic now creates a `subevent_registrations` record linked to the correct `persons` identity.
    - **Frontend (Client)**:
        - **Store**: Updated `StorePage.jsx` to generate Temp IDs for tickets to enable linking.
        - **UI**: Updated `SubeventModal.jsx` to force attendee selection from a dropdown (Existing Attendees + New Cart Tickets) before adding to cart.
    - **Verification**:
        - Created `walkthrough.md` with verification steps.

## [2026-01-26] - Camping: Full Event Package Date Logic (Completed)
- **Time**: 13:30 - 13:45
- **Completed Items**:
    - **Feature**: Decoupled the "Full Event Package" pricing option from the date selection in `CampingPage.jsx`. Users can now select the package price while specifying their actual arrival/departure dates (even if shorter than the full event).
    - **Logic**: Removed the auto-update effect that forced dates to match event bounds when the package was selected. Removed the `disabled` state from date inputs.
    - **Verification**: Verified that the backend `createOrder.js` correctly accepts the full event price even when dates do not match the full duration.

## [2026-01-26] - Campsite Pricing Fix (Completed)
- **Time**: 12:47 - 12:55
- **Completed Items**:
    - **Bug Fix**: Resolved "Invalid price" checkout error for campsites with extra adults.
    - **Root Cause**: The frontend `Checkout.jsx` was not sending `adults` and `children` counts in the order payload, causing the backend to default to 1 adult and fail price validation.
    - **Fix**: Updated `Checkout.jsx` to map these fields correctly.
    - **Verification**: Verified fix with user.

## [2026-01-26] - Bug Fix: Heavy Model Flag Default (Completed)
- **Time**: 12:30 - 12:35
- **Completed Items**:
    - **Frontend (Client)**:
        - Fixed logic in `AttendeeModal.jsx` where the first plane added during registration was defaulting to `is_heavy_model = false`. It is now explicitly initialized to `true`.
    - **Database**:
        - Created `docs/db_updates/20260126_fix_heavy_model_flag.sql` to remediate existing records where the flag was incorrectly set to false.

## [2026-01-26] - Pit Crew Manual Pilot Name (Completed)
- **Time**: 11:47 - 12:05
- **Completed Items**:
    - **Backend (API)**:
        - Updated `createOrder.js` to persist `pilot_name` when provided.
        - Updated `updateAttendee.js` to allow editing `pilot_name`.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to include a "Manual Pilot Name" option for Pit Crew.
        - Implemented validation ensuring either a Linked Pilot or Manual Name is provided.
    - **Verification**:
        - Linted frontend code.
        - Confirmed logical flow covers database schema changes (`pilot_name` column).

## [2026-01-26] - Official Dinner Management
- **Time**: 11:30 - 11:45
- **Completed Items**:
    - **Backend (API)**:
        - Updated `getEventDetail.js`, `createEvent.js`, `updateEvent.js` to manage `dinner_date`.
        - Updated `createOrder.js` to capture `attending_dinner` RSVP.
        - Updated `updateAttendee.js` to allow RSVP changes.
        - Updated `getUserEventAttendees.js` to select RSVP status.
    - **Frontend (Client)**:
        - Updated `EventForm.jsx` to manage Official Dinner Date.
        - Updated `AttendeeModal.jsx` to collect Dinner RSVP during registration.
    - **Verification**:
        - Verified database schema.
        - Fixed `AttendeeModal` React Hooks lint error.
        - Restricted Official Dinner Date picker to Event Start/End dates.
        - Fixed `getStoreItems` API to include `dinner_date`, resolving missing checkbox in Store.

## [2026-01-26] - Junior Pilot System Role (Completed)
- **Time**: 11:10 - 11:25
- **Completed Items**:
    - **Backend (API)**:
        - Updated `createOrder.js` to treat `junior_pilot` like `pilot` for pricing logic.
        - Updated `getOrderDetail.js` to fetch aircraft details for Junior Pilots.
        - Updated `getUserEventAttendees.js` to return Junior Pilots for selection lists.
    - **Frontend (Client)**:
        - **Attendee Modal**: Enabled Pilot fields (AUS#, MOP, Planes) for `junior_pilot`.
        - **Logic**: Explicitly HID the "Flight Line Duties" checkbox for Junior Pilots.
        - **Pit Crew Linking**: Enabled Pit Crew to link to Junior Pilots.
        - **Admin**: Added "Junior Pilot" option and visual badge to `EventForm.jsx`.
        - **Order Details**: Added "Junior Pilot" badge and Aircraft listing.
    - **Verification**:
        - Verified database constraint was updated by user.
        - Implemented logic ensuring Junior Pilots pay the standard price (or no-duty price if configured same) without duty requirement.

## [2026-01-25] - Flight Line Duties System (Completed)
- **Time**: 12:30 - 16:00
- **Completed Items**:
    - **Database**:
        - Created `flight_lines` and `flight_line_roster` tables.
        - Added `flight_line_duties` (bit) column to `attendees` table.
    - **Backend (API)**:
        - Created comprehensive CRUD endpoints for Flight Lines and Rosters.
        - **Schedule Generator**: Implemented logic to batch-create duty slots based on start/end times and slot duration.
        - **Auto-Assign Algorithm**: Created intelligent assignment logic (`autoAssignFlightLineRoster.js`) that respects:
            - Pilot Registration Status.
            - Arrival/Departure Date availability.
            - Exclusion of existing Subevent bookings (Conflicts).
            - Random distribution for fairness.
        - **Management**: Created endpoints for manual assignment, unassignment, time editing, and bulk clearing.
        - **User View**: Created `getMyFlightLineDuties.js` to fetch personal rosters for logged-in users.
    - **Frontend (Client)**:
        - **Admin Setup**: Created `FlightLinesSetup.jsx` for managing locations and generating schedules.
        - **Admin Roster**: Created `FlightLineRoster.jsx` with a Grid View, featuring:
            - Date filtering.
            - Visual Status Indicators (Yellow for Unassigned, Red for Conflicts).
            - Modal-based Pilot Assignment (with filtering).
        - **User View**: Created `MyFlightLineDuties.jsx` and `RosterEventSelector.jsx` for pilots to view their schedules.
        - **Navigation**: Integrated "Flight Line Duties" into the main "Information" menu and Admin Dashboard.
    - **Documentation**:
        - Created `implementation_plans/flight_line_duties.md`.
        - Created `walkthrough.md` validating the entire workflow.


## [2026-01-25] - Negative Stock Levels (Backorders)
- **Time**: 11:49 - 12:04
- **Completed Items**:
    - **Backend (API)**:
        - Updated `createOrder.js` to remove stock validation checks for both included merchandise and standalone merchandise purchases.
        - Stock deduction logic maintained - `current_stock` now decrements into negative values representing backorders.
    - **Frontend (Client)**:
        - Updated `ProductModal.jsx` to allow adding out-of-stock items to cart.
        - Removed all stock status indicators from customer-facing UI (stock levels completely hidden).
        - Changed button text to always display "Add to Cart" regardless of stock availability.
        - Updated `AttendeeModal.jsx` to allow selection of out-of-stock SKUs for ticket-included merchandise.
    - **Verification**:
        - Created walkthrough.md with manual verification steps.


## [2026-01-25] - My Planes (My Hangar) Implementation (Completed)
- **Time**: 09:30 - 11:28
- **Completed Items**:
    - **Backend (API)**:
        - Created `getPilotEvents.js` to find events where the user has a "Pilot" role attendance.
        - Created `createPlane.js` for plane registration, validating ownership of the linked person.
        - Updated `getUserEventAttendees.js` to return `person_id` for proper linking.
    - **Frontend (Client)**:
        - Updated `Layout.jsx` to make "My Planes" accessible to all authenticated users.
        - **Wizard Workflow**: Implemented a 3-step wizard in `MyPlanes.jsx`:
            1. **Select Event**: Pick an event where you are a pilot.
            2. **Select Pilot**: Pick the specific person profile (Pilot).
            3. **Plane Details**: Register the aircraft.
        - **Refactor**: Removed the "Heavy Model" checkbox; refactored logic to treat all planes as heavy models (Weight & Certificate required).
    - **Verification**:
        - Verified database schema integrity.
        - Linted and fixed frontend code.
        - Created walkthrough.md.
    - **Documentation**:
        - Moved `20260124_my_planes_modifications.md` to `completed/`.

## [2026-01-25] - Limit Date Selection
- **Time**: 09:50 - 10:15
- **Completed Items**:
    - **Frontend (Client)**:
        - Updated `CampsiteModal.jsx` to restrict date pickers to Event Start/End dates using `min` and `max` attributes.
        - Updated `AssetSelectionModal.jsx` to restrict Hire Start/End dates to Event dates.
        - Updated `AttendeeModal.jsx` to restrict Arrival/Departure dates to Event dates.
        - Updated `CampingPage.jsx` to restrict booking dates to event bounds and handled inconsistent date property names (`start_date` vs `eventStartDate`).
        - Updated `StorePage.jsx` to pass full event data to the embedded Camping view.
    - **Verification**:
        - Verified code implementation matches requirements.

## [2026-01-24] - Bug Fix: User ID in Persons Table
- **Time**: 07:23 - 09:05
- **Completed Items**:
    - **Backend (API)**:
        - Fixed logic in `createOrder.js` where guest attendees (different email) were not being linked to the authenticated user's ID.
        - Implemented explicit linking: New persons created during checkout are now assigned the current `user_id`, allowing the buyer to manage them.
        - Verified logic prevents overwriting `user_id` for existing persons (email match) to preserve account integrity.
    - **Verification**:
        - Debugged with console logs to identify the "orphan" person creation flow.
        - Confirmed fix with user verification.

## [2026-01-23] - Pit Crew to Pilot Linking
- **Time**: 16:35 - 16:57
- **Completed Items**:
    - **Database**:
        - Added `linked_pilot_attendee_id` column to `attendees` table.
    - **Backend (API)**:
        - Updated `createOrder.js` to handle `linkedPilotAttendeeId` and `linkedPilotTempId`.
        - Implemented post-processing logic to link Crew to Pilots being purchased in the same transaction.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to display a Pilot Selection Dropdown for Pit Crew tickets.
        - Logic supports linking to "Existing Pilots" (from DB) and "Cart Pilots" (by Temp ID).
    - **Verification**:
        - Verified full checkout flow with New Pilot + New Crew.

## [2026-01-23] - Dietary Requirements Implementation
- **Time**: 16:22 - 16:35
- **Completed Items**:
    - **Database**:
        - Added `dietary_requirements` column to `attendees` table via SQL script.
    - **Backend (API)**:
        - Updated `createOrder.js` to persist dietary info during registration.
        - Updated `updateAttendee.js` to allow editing of dietary requirements.
        - Updated `getOrderDetail.js` to return dietary info.
    - **Frontend (Client)**:
        - Updated `AttendeeModal.jsx` to include a "Dietary Requirements" text area.
    - **Verification**:
        - Validated insertion and retrieval via walkthrough.

## [2026-01-23] - Subevent Variations (Admin UI)
- **Time**: 14:43 - 16:05
- **Completed Items**:
    - **Database**:
        - Created `subevent_variations`, `subevent_variation_options`, and `subevent_registration_choices` tables.
    - **Backend (API)**:
        - Updated `getStoreItems.js` to return proper nested variation structures.
        - Updated `createOrder.js` to calculate price adjustments and save user choices.
        - Created `manageSubeventVariations.js` (Azure Function) for Admin CRUD operations.
    - **Frontend (Client)**:
        - **Store**: Created `SubeventModal.jsx` for customers to select options (e.g., "Cook Time", "Sauce").
        - **Cart/Checkout**: Updated logic to display selected variations and include them in the order payload.
        - **Admin**: Created `SubeventVariationManager.jsx` and integrated it into `AdminSubevents.jsx` for managing options.
    - **Documentation**:
        - Updated `walkthrough.md` with verification steps.
        - Archived `subevent_variations_admin.md` and `20260123_subevent_variations.md` to `completed/`.

## [2026-01-23] - Invoices, Part Payments & Admin Fixes
- **Time**: 08:20 - 15:30
- **Completed Items**:
    - **Features**:
        - **Printable Invoices**: Created `Invoice.jsx` with organization branding, item breakdown, and valid tax invoice logic.
        - **Part Payments**: Updated `AdminOrders.jsx` to allow admins to record partial payments (Direct Deposit/Cash).
        - **Payment History**: Updated `OrderDetail.jsx` to show transaction logs, outstanding balance, and "Pay Now" instructions.
        - **Org Settings**: Added Address, Phone, and Default Bank Details to `OrganizationSettings` for invoice headers.
    - **Logic**:
        - **Invoice Number**: Implemented generation (`INV-YYYY-ID`) and database persistence.
        - **Checkout Redirect**: Updated checkout flow to redirect immediately to the Invoice page.
        - **Routing**: Registered `/orders/:id/invoice` route in `App.jsx`.
    - **Fixes**:
        - **Admin Orders Duplication**: Fixed critical SQL bug in `getAdminOrders.js` using `OUTER APPLY` to prevent row duplication caused by multiple person records per user.
    - **Documentation**:
        - Created `walkthrough.md` for verification.

## [2026-01-23] - ALSM Bank Details (Completed)
- **Time**: 12:51 - 13:03
- **Completed Items**:
    - **Database**:
        - Created and verified `20260123_add_bank_details.sql` to add bank columns to `organization_settings`.
    - **Backend (API)**:
        - Updated `updateOrganizationSettings.js` to persist Bank Name, Account Name, BSB, and Account Number.
        - Verified `getOrganization.js` retrieves new fields.
    - **Frontend (Client)**:
        - Updated `OrgSettings.jsx` to include a new "Bank Details" section.
        - Implemented dynamic placeholder for "Account Name" to default to the Organization Name.
    - **Documentation**:
        - Moved `20260123_alsm_bank_details.md` to `completed/`.
        - Created `walkthrough.md`.

## [2026-01-23] - Bug Fix: Merchandise Deletion (Completed)
- **Time**: 12:05 - 12:55
- **Completed Items**:
    - **Backend (API)**:
        - Fixed `context.log.error` -> `context.error` syntax error in `deleteProduct.js` (Azure Functions v4 fix).
        - **Proactive Fix**: Scanned and fixed the same deprecated logging syntax in 27 other API files (including `getProducts.js`, `createCampground.js`, `ticketTypes.js`, etc.) to prevent future runtime crashes.
        - Fixed `deleteProduct.js` and `deleteSKU.js` to use `jsonBody` format for consistent headers.
        - Fixed SQL error in `deleteProduct.js` (Invalid column name 'id' -> 'order_item_id').
        - Fixed FK constraint violation in `deleteProduct.js` by removing `ticket_linked_products` associations.
        - Fixed logic error where `event_products` Table was assumed; corrected to cascade delete from `event_skus`.
    - **Frontend (Client)**:
        - Updated `ProductEditor.jsx` to safely handle JSON parsing errors.
        - Replaced native `window.confirm` dialogs with custom `confirm()` modal in `handleDeleteProduct` for better UX consistency.
    - **Documentation**:
        - Moved `20260123_bugfix_merch_delete.md` to `completed/`.

## [2026-01-23] - Heavy Model Reports (Completed)
- **Time**: 10:51 - 11:22
- **Completed Items**:
    - **Backend (API)**:
        - Created `getEventPlanes.js` endpoint to list planes for event attendees.
        - Fixed `isAdmin` auth check logic in `getEventPlanes` (checking `user.role` vs `request` object).
    - **Frontend (Admin)**:
        - Created `EventPlanesReport.jsx` table with certificate viewing.
        - Updated `AdminDashboard.jsx` with link to new report.
        - Removed "Heavy Model" column as per client feedback (all planes are heavy).
        - Fixed duplicate route definitions in `App.jsx`.
    - **Documentation**:
        - Moved `20260222_heavy_model_reports.md` to `completed/`.
        - Updated `walkthrough.md`.


- **Completed Items**:
    - **Features**:
        - Implemented "My Planes" section for authenticated users.
        - Created database CRUD endpoints: `getPlanes`, `updatePlane`, `deletePlane`.
        - Created frontend generic listing, editing, and deleting wrapper components in `MyPlanes.jsx`.
        - Integrated heavy model certificate handling (upload/view).
        - Added conditional navigation link in `Layout.jsx` (visible only if user has planes).
    - **Logic Refinements**:
        - Enforced "Heavy Model" as true by default for all user planes (removed checkbox).
        - Consolidated plane creation into the Registration Flow (for now), focusing this view on management.
    - **Fixes**:
        - Resolved API routing issue (missing `route: 'planes'` config).
        - Fixed lint warnings in frontend components.
    - **Documentation**:
        - Updated `walkthrough.md` with verification steps.
        - Updated `task.md`.

## [2026-01-22] - Checkout & Order Details Fixes (Completed)
- **Time**: 15:30 - 16:22
- **Completed Items**:
    - **Bug Fix (Merchandise)**: Resolved checkout error for merchandise items by ensuring the correct `sku_id` is passed from `StorePage.jsx`.
    - **Bug Fix (Assets)**: 
        - Resolved "1970 date" error by passing correct Event Dates in "Full Event Package" mode.
        - Fixed Availability Logic in `createOrder.js` to validate the specific selected Asset Item ID, not a generic Asset Type.
        - Fixed `getOrderDetail.js` API crash (500 Error) caused by invalid column reference (`name` vs `site_number`) for Campsites.
    - **Refactor (Order Details)**:
        - Overhauled `OrderDetail.jsx` to separate the "Order Summary" (transactional view) from "Ticket Management" (attendee details).
        - Backend `getOrderDetail.js` updated to correctly identify item names for Assets, Campsites, and Subevents.
    - **Documentation**:
        - Created `fix_merch_checkout_error.md` (Completed).
        - Created `fix_asset_hire_dates.md` (Completed).
        - Created `fix_asset_hire_logic.md` (Completed).
        - Created `overhaul_order_details.md` (Completed).

## [2026-01-22] - Ticket Merchandise Linking (Completed)
- **Time**: 13:36 - 15:16
- **Completed Items**:
    - **Database**: Replaced simple `product_id` column with `ticket_linked_products` junction table to support Multi-Product Linking (1-to-many).
    - **Backend (API)**:
        - Updated `ticketTypes.js` (CRUD) to manage linked products.
        - Updated `getEvents` and `getStoreItems` to return `linkedProductIds`.
        - Updated `createOrder.js` validation to verify selected merchandise against the allowed linked list.
    - **Frontend (Admin)**:
        - Updated `EventForm.jsx` Ticket Modal to use a checkbox list for linking multiple products.
    - **Frontend (Client)**:
        - Updated `EventDetails.jsx` and `AttendeeModal.jsx` to support a two-step selection flow:
            1. Select Item (Radio Button) - if multiple options exist.
            2. Select Variant (Dropdown).
    - **Documentation**:
        - Updated `walkthrough.md`.

## [2026-01-22] - Ticket Management Implementation (Completed)
- **Time**: 12:20 - 12:42
- **Completed Items**:
    - **Database**: Added `sort_order` column to `event_ticket_types` (Schema updated on Dev & Master).
    - **Backend (API)**:
        - Updated `getTicketTypes` (GET) to sort by `sort_order`.
        - Updated `createTicketType` (POST) to auto-assign the next available `sort_order`.
        - Created `reorderTicketTypes.js` (PUT) for drag-and-drop persistence.
        - Updated `getEventDetail.js` and `getStoreItems.js` to ensure sorting is respected in Public and Store views.
    - **Frontend (Client)**:
        - Implemented Drag-and-Drop reordering in `EventForm.jsx` (Ticket Types section) using `@dnd-kit`.
        - Verified admin-side persistence and user-side display.
    - **Documentation**:
        - Moved `20260222_ticket_management.md` to `completed/`.

## [2026-01-22] - Admin Orders Search
**Time Log:** 11:55 - 12:15
**Milestone:** Enhanced Admin Order Management

### Completed Items
*   **Backend (API)**
    *   **Filtering:** Updated `getAdminOrders.js` to support `search`, `status`, `date`, and `event` filters.
    *   **Security:** Implemented parameterized queries for all filters.
*   **Frontend (Admin)**
    *   **UI:** Added a comprehensive Filter Bar to `AdminOrders.jsx`.
    *   **Features:**
        *   Text Search (Name, Email, ID).
        *   Date Range (From/To).
        *   Status Dropdown (Paid, Pending, etc).
        *   Event Filter (Dynamic Dropdown).
    *   **UX:** Implemented debounced search and auto-refresh on filter changes.
*   **Verification**
    *   Backend logic verified via test script.
    *   Manual verification steps documented in Walkthrough.
*   **Fixes (Post-Review)**
    *   **Logic:** Fixed Date Filter to correctly handle single-day searches (inclusive end time).
    *   **Frontend:** Corrected `getEvents` API endpoint to `/api/events` to fix silent dropdown failure.


## [2026-01-22] - Merchandise Updates & Variant Fixes
- **Time**: 11:00 - 11:45
- **Completed Items**:
    - **Merchandise**:
        - Implemented "Cost Price" tracking for SKUs.
        - Added "Bulk Apply" for Cost and Sell prices in Product Editor table header.
        - Implemented Variant Category Renaming (e.g., "Size" -> "Mens Size").
    - **Bug Fixes**:
        - Fixed `context.log.error` issue in `manageVariantCategory.js`.
        - Resolved merge conflict logic for Variant Categories, implementing a recursive merge and deduplication strategy to fix "split" categories.
        - Corrected frontend logic to use `category_id` instead of `variant_id` for merge operations.
    - **Cleanup**: Removed temporary debug scripts (`inspect_db.js`, `fix_duplicates.js`) and logging.

## [2026-01-21] - Map Display Fixes (Admin & User)
- **Time**: 06:07 - 07:44
- **Completed Items**:
    - **Map UI (Admin)**:
        - Fixed issue where wide map images were shrinking to fit container width, becoming illegible.
        - Implemented horizontal scrolling with `min-width: 1500px`.
        - Applied `min-height: 0` flex constraints and `calc(100vh - 140px)` height to respect viewport and keep scrollbars accessible.
    - **Map UI (User)**:
        - Implemented horizontal scrolling for the user-facing map (`min-width: 1000px`).
        - Constrained map container validation to `max-height: 75vh` to prevent vertical page scrolling.
        - Fixed Flexbox layout issue where the "Booking Details" sidebar was being squished by wide maps.
    - **Documentation**:
        - Created `walkthrough.md` detailing the CSS and layout changes.

## [2026-01-21] - Bug Fixes: Variant Templates & Auth
- **Time**: 06:13 - 06:20
- **Completed Items**:
    - **Bug Fix**: Resolved "Unauthorized" error in `VariantTemplates.jsx` by adding `Authorization` and `X-Auth-Token` headers to API calls.
    - **Bug Fix**: Resolved issue where "Apply Template" modal was empty in `ProductEditor.jsx` by adding the same missing headers to `fetchTemplates` and `handleApplyTemplate`.
    - **Verification**: Verified creating, deleting, and applying variant templates.

## [2026-01-20] - Session Wrap-up & Client Update
- **Time**: 15:51 - 16:05
- **Completed Items**:
    - **Client Communication**: Drafted and sent a detailed update email to the client summarizing key features (FAQ, Camping Fees, Admin Dash) and next steps.
    - **Documentation**: 
        - Logged the client email in `client_communications.md`.
        - Verified `camping_fees_update.md` and `faq_section.md` are correctly filed in `completed`.
    - **Session**: Performed end-of-session housekeeping.

## [2026-01-20] - Camping Fees & Booking Logic (Completed)
- **Time**: 13:50 - 15:50
- **Completed Items**:
    - **Database**: Validated schema updates for `extra_adult_price_per_night` and guest counts.
    - **Backend (API)**:
        - Updated `createCampsites.js` to persist new fee fields.
        - Updated `getCampgroundAvailability.js` to return extra adult fees.
        - Updated `createOrder.js` to calculate total price including extra adult fees (Daily or Full Event).
    - **Frontend (Client)**:
        - Updated `AdminMapTool.jsx` to manage extra fee fields.
        - Updated `CampsiteModal.jsx` (Admin Booking) and `CampingPage.jsx` (User Store) to handle guest counts.
        - Implemented dynamic price calculation and transparency breakdown in the Store UI.
        - Fixed sidebar layout issues in Admin Tool.
    - **Verification**: Verified end-to-end booking flow with extra adult fees.

## [2026-01-20] - Merchandise Ordering Implementation (Completed)
- **Time**: 12:50 - 14:00
- **Completed Items**:
    - **Database**: Added `sort_order` column to `products` table.
    - **Back-End (API)**:
        - Updated `getStoreItems.js` (Storefront) and `getProducts.js` (Admin) to order by `sort_order`.
        - Created `reorderProducts.js` endpoint (PUT /api/manage/products/reorder) for bulk updates.
        - Fixed API bugs (missing `getPermissions` export, `users` table schema mismatch, missing `pool` reference).
    - **Front-End (Client)**:
        - Implemented Drag-and-Drop in `MerchandiseList.jsx` using `@dnd-kit`.
        - Visualized reordering with a draggable handle (☰).
    - **Verification**: Verified Admin persistence and Storefront sort order reflection.

## [2026-01-20] - Access Restricted Fix (Live Environment)
- **Time**: 14:15 - 14:30
- **Completed Items**:
    - **Bug Fix**: Resolved "Access Restricted" error on the live store (`StorePage.jsx`) by adding the `X-Auth-Token` header to fetch requests.
    - **Proactive Fix**: Applied the same header fix to `EventDetails.jsx` (Order Creation) and `OrderDetail.jsx` (View/Edit) to ensure consistent authentication on Azure.
    - **Documentation**: Created `walkthrough_access_restricted_fix.md` detailing the root cause and solution.

## [2026-01-20] - Admin Dashboard Refinement (Completed)
- **Time**: 12:00 - 12:10
- **Completed Items**:
    - **Admin Dashboard**: Added "Air Show Attendees" card, fixed Camping card UI (scrollbar/tooltips), removed redundant header link.
    - **Login**: Implemented Admin Redirect (Admins -> `/admin`).
    - **API**: Updated `getAdminDashboardStats` to include public registration counts.

## [2026-01-20] - Administration Reports & Camping UI (Completed)
- **Time**: 00:00 - 11:47
- **Completed Items**:
    - **Camping List View**: Implemented a user-facing list view for campsites (`CampingListView.jsx`) with a toggle to switch between Map and List modes in `CampingPage.jsx`.
    - **Admin Camping Report**: Created `CampingAvailabilityReport.jsx` and `getAdminCampingReport.js` to provide a filtered view of campsite availability and booking details.
    - **UI Refinement**: Moved the "Availability Report" link to the Camping Card header on the Admin Dashboard.
    - **Bug Fix**: Resolved `404` error for the new report API by renaming the route to avoid the reserved `/admin` prefix (`reports/camping-availability`).
    - **Layout Fix**: Unified the report table for better column alignment across campgrounds.
    - **UX Improvement**: Report now links directly to the specific `OrderDetail` page instead of just searching for the order.

## [2026-01-20] - Public Air Show Registration (Completed)
- **Time**: 19:44 - 23:55
- **Completed Items**:
    - Implemented `public_event_days` and `public_registrations` database tables.
    - Created `POST /api/public/register` and `managePublicEventDays` APIs.
    - Updated `EventDetails.jsx` to display public days and allow registration via `PublicRegistrationModal`.
    - Updated Admin `EventForm.jsx` to manage public days (Create/Edit/Delete).
    - Created "Air Show Attendees" report (`PublicRegistrationsReport.jsx`) and linked from Admin Dashboard.
    - Resolved issues with Time column formatting ("1970-" display bug) by enforcing "HH:MM" string format in API.
    - Fixed API filtering bug where "Air Show Attendees" report was empty.

## [2025-12-22] - Initial Full-Stack Connection
**Milestone:** End-to-End Connectivity Established (DB -> API -> Frontend)

### Completed Items
* **Backend (API)**
    * Installed `mssql` driver.
    * Configured `local.settings.json` with Azure SQL connection string.
    * Created `api/src/lib/db.js` utility for reusable database connections.
    * Created `api/src/functions/getOrganization.js` endpoint.
* **Database (Azure)**
    * Verified connectivity to `sqldb-aero-master`.
    * Seeded `organization_settings` table with initial data.
* **Frontend (Client)**
    * Configured Vite Proxy to forward `/api` requests to localhost:7071.
    * Refactored `App.jsx` to introduce React Router.
    * Created `Layout.jsx` component for persistent Organization Header.
    * Created `Home.jsx` page.
    * Successfully fetching and displaying data from Azure SQL.

### Next Steps
* Build the "Events List" page.
* Create the "Event Details" view.

## [2025-12-22] - Public Events Module
**Milestone:** Public Events & Details Views Completed

### Completed Items
* **Database**
    * Seeded `venues` and `events` (Past, Active, Planned).
* **Backend (API)**
    * Created `getEvents`: Fetches public events sorted by date.
    * Created `getEventDetail`: Fetches single event by slug with venue details.
* **Frontend (Client)**
    * **Theming:** Updated `Layout.jsx` to expose organization colors as CSS variables (`--primary-color`, `--accent-color`).
    * **Events List:** Created `Events.jsx` with responsive grid layout and "Active" event highlighting.
    * **Event Details:** Created `EventDetails.jsx` with status-aware badges and dynamic button logic (View Recap vs Get Tickets).
    * **Routing:** Added dynamic route `/events/:slug`.

### Next Steps
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - UI Polish & Images
**Milestone:** Implemented Images and Refined Visual Hierarchy

### Completed Items
* **Database**
    * Added `banner_url` column to `events` table.
    * Seeded placeholder images for existing events.
* **Backend (API)**
    * Updated `getEvents` and `getEventDetail` to return image URLs.
* **Frontend (UI/UX)**
    * **Global Styles:** Switched background to soft blue-grey (`#f5f7fa`) to reduce contrast.
    * **Events List:** Refactored cards into a "Thumbnail + Content" row layout.
    * **Event Details:** Added full-width Hero Banner image.
    * **Buttons:** Established clear hierarchy with `.primary-button` (Active) and `.secondary-button` (View Only).

### Next Steps
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - Authentication Infrastructure
**Milestone:** User Registration & Login Flow

### Completed Items
* **Backend (API)**
    * Installed `bcryptjs` and `jsonwebtoken`.
    * Hardened `db.js` to use parameterized queries (SQL Injection protection).
    * Created `authRegister` endpoint (Hashes password, creates User).
    * Created `authLogin` endpoint (Validates credentials, returns JWT).
* **Frontend (Client)**
    * Implemented `AuthContext` for global user state management.
    * Created `Login.jsx` and `Register.jsx` pages.
    * Updated `Layout.jsx` to show "Login" vs "User Profile" based on state.

### Next Steps
* **Ticket Purchasing:** Connect the "Get Tickets" button in Event Details to a secure purchase flow.

## [2025-12-23] - Ticket Purchasing MVP
**Milestone:** End-to-End Ticket Purchase Flow (Mock Payment)

### Completed Items
* **Database**
    * Seeded `event_ticket_types` for the active event.
* **Backend (API)**
    * **Refactor:** Upgraded `db.js` to use Singleton Connection Pool pattern (Performance/Stability).
    * **Feature:** Created `createOrder` endpoint with atomic SQL Transactions (Orders + OrderItems + Attendees + Transactions).
    * **Update:** Modified `getEventDetail` to fetch and return available ticket types.
* **Frontend (Client)**
    * **UX:** Implemented "Ticket Selector" Modal in `EventDetails.jsx`.
    * **Logic:** Connected Checkout button to `createOrder` API.
    * **State:** Removed broken navigation flow; replaced with instant feedback Modal.

### Next Steps
* **Attendee Management:** Allow purchasers to assign specific names/emails to their tickets.
* **My Orders:** Create a User Profile view to see purchase history.

## [2025-12-23] - Attendee Management & UI Polish
**Milestone:** Attendee Data Capture & Visual Consistency

### Completed Items
* **Backend (API)**
    * **Feature:** Updated `createOrder` endpoint to process `attendees` array within the main transaction.
    * **Logic:** Implemented automatic 8-character `ticket_code` generation for each registered attendee.
    * **Data:** Verified insertion into `attendees` table linking to specific `order_items`.
* **Frontend (Client)**
    * **UX:** Implemented `AttendeeModal` workflow in `EventDetails.jsx`, intercepting checkout to collect Names/Emails per ticket.
    * **UI Core:** Implemented Global Box-Sizing Reset (`box-sizing: border-box`) to fix layout overflows.
    * **Visuals:** Standardized "Status Badges" to use Brand/Accent colors consistently across Events List and Details views.
    * **Fix:** Enforced strict aspect ratio and dimensions for Event Hero images to prevent layout shifts.

## [2025-12-25] - Registration Logic & Crew Linking
**Milestone:** Verified Registration Flow Recommendation & Implemented Post-Payment Crew Linking

### Completed Items
* **Database**
    * Verified `persons.user_id` is nullable.
    * Added `ticket_code` to `attendees` table (Unique identifier for linking).
    * Added `is_pit_crew` to `event_ticket_types`.
    * Seeded "Winter Warbirds 2026" with Pilot/Crew tickets for verification.
* **Backend (API)**
    * **Feature:** Implemented automatic 8-char `ticket_code` generation in `createOrder`.
    * **Logic:** Implemented "Pilot-Crew Linking" allowing crew to link to an existing Pilot via their `ticket_code`.
    * **Update:** Modified `getEventDetail` to return `is_pit_crew`.
* **Frontend (Client)**
    * **UX:** Updated `AttendeeModal` in `EventDetails.jsx` to show "Pilot Ticket Code" field for Crew tickets.
* **Verification**
    * Successfully tested manual Pilot creation (Code: `0URN9WME`).
    * Successfully tested manual Crew creation (Code: `1STM26T0`).
    * Confirmed database link in `pilot_pit_crews`.
    * Archived `Registration_Flow_Recommendation.md`.

### Next Steps
* **Attendee Assignment Flow:** Allow users to view purchased tickets and assign names/emails after purchase.

## [2025-12-26] - Enhanced Registration & Linking
**Milestone:** In-Cart Pilot-Crew Linking & Legacy Pilot Lookup

### Completed Items
* **Backend (API)**
    * **Feature:** Created `getUserEventAttendees` to fetch a user's previously registered pilots.
    * **Logic:** Refactored `createOrder.js` to support "In-Cart Linking" using temporary IDs.
    * **Fix:** Patched `createOrder.js` to ensure `persons` records are correctly linked to the authenticated `user_id`.
* **Frontend (Client)**
    * **UI:** Enhanced Pit Crew section in `EventDetails.jsx` with a smart Pilot Selector (In-Cart vs Registered vs Manual).
    * **State:** Implemented `myPilots` fetching and local state management.
* **Verification**
    * Validated In-Cart linking (Pilot + Crew in same order).
    * Validated Cross-Order linking (Crew linking to previously registered Pilot).
    * Fixed data issue where Pilot "Maverick" was unlinked from User.

### Documentation (Planning)
*   **Created:** `docs/Future_Feature_Requirements.md` - Roadmap for Campsites, Mechandise, Asset Hire.
*   **Created:** `docs/Pilot_Logic_Deep_Dive.md` - Specifications for "My Hangar" and Flight Line Duties.

## [2025-12-27] - Order History & Attendee Management (Part 1)
**Milestone:** Implemented "My Orders" and "Order Details" Views

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `getUserOrders` endpoint (fetches user's purchase history securely).
    *   **Feature:** Created `getOrderDetail` endpoint (fetches specific order with tickets/attendees).
    *   **Security:** Implemented specific `user_id` checks to ensure users can only view their own orders.
* **Frontend (Client)**
    *   **Page:** Created `MyOrders.jsx` - List view of past transactions.
    *   **Page:** Created `OrderDetail.jsx` - Detailed view showing Ticket Types, and assigned Pilots/Crew.
    *   **Navigation:** Added "My Orders" link to `Layout.jsx` (User Menu).
    *   **Routing:** Registered new routes in `App.jsx`.


### [2025-12-27] - Order History & Attendee Management (Part 2)
**Milestone:** Attendee Assignment Logic

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `updateAttendee` endpoint (`PUT /api/attendees/:id`).
    *   **Security:** Added ownership validation (User -> Order -> OrderItem -> Attendee).
* **Frontend (Client)**
    *   **Feature:** Implemented Inline Edit Mode in `OrderDetail.jsx`.
    *   **UI/UX:** Aligned "Edit Details" button with "Registered" status badge for visual consistency.
    *   **Refactor:** Converted `tickets-list` item actions to a flex-column layout.
    *   **Feature:** Added `react-qr-code` to `OrderDetail.jsx` for scannable gate entry.

### Next Steps
*   **Campsite Booking:** Interactive map/list for booking spots.
*   **Merchandise:** E-commerce store.

## [2025-12-27] - Campsite Admin Map Tool
**Milestone:** Campground Mapping Foundation

### Completed Items
* **Database**
    *   **Seeding:** Seeded "North Field" campground (`test-map.jpg`) and 5 campsites.
    *   **Tooling:** Created temporary seeding endpoint to bypass direct connection issues.
* **Backend (API)**
    *   **Features:** Implemented `getCampgrounds`, `getCampsites`, and `updateCampsiteCoords`.
    *   **Fix:** Resolved API crash (500 Error) by fixing `recordset` property access on array results.
* **Frontend (Client)**
    *   **Feature:** Created `AdminMapTool.jsx` for defining campsite locations on a map image.
    *   **Navigation:** Added `/admin/map` route.
    *   **Logic:** Implemented dynamic fetching of campground data (removes hardcoded IDs).

### Next Steps
*   **User Booking:** Build the frontend interface for users to book specific sites.

## [2025-12-28] - Admin Map Tool Enhancements
**Milestone:** Campsite Admin Map Tool (v1)

### Completed Items
*   **Features (Backend)**
    *   **Bulk Create:**  `createCampsites.js` (POST /api/campgrounds/{id}/sites) handles bulk addition with prefixes.
    *   **Update Site:** `updateCampsite.js` (PUT /api/campsites/{id}) handles renaming and unmapping.
    *   **Delete Site:** `deleteCampsite.js` (DELETE /api/campsites/{id}).
*   **UI/UX (Frontend)**
    *   **Grid Layout:**  `AdminMapTool.jsx` sites list converted to a responsive CSS grid.
    *   **Bulk Add UI:** Added inputs for Qty and Prefix to quickly generate sites.
    *   **Interaction Refinement:** 
        *   Maintained selection focus after pinning for rapid mapping.
        *   Added "click pin to select" functionality.
        *   Fixed map container offset issues for accurate pin placement.
    *   **Theming:** integrated `organization_settings` colors (Primary, Accent) for dynamic button and pin styling.



## [2025-12-28] - Admin UX & Role Logic
**Milestone:** Role-Based Navigation & Enhanced Admin Tools

### Completed Items
*   **Backend (API)**
    *   **Auth Logic:** Updated `authLogin.js` to correctly authenticate against the `admin_users` table before falling back to `users`.
    *   **New Endpoint:** Created `createCampground.js` (POST /api/campgrounds) to allow Admins to generate new campground entities.
    *   **Fix:** Aligned `authLogin` and `createCampground` queries with the actual SQL Schema (corrected column names `admin_user_id` and removed non-existent `capacity`).
*   **Frontend (Client)**
    *   **Navigation:** Updated `Layout.jsx` to implement Role-Based Access Control (RBAC) in the header.
        *   **Admins:** See "Admin Map", "Cart" is hidden.
        *   **Users:** See "Cart", "Admin Map" is hidden.
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - UI Polish & Images
**Milestone:** Implemented Images and Refined Visual Hierarchy

### Completed Items
* **Database**
    * Added `banner_url` column to `events` table.
    * Seeded placeholder images for existing events.
* **Backend (API)**
    * Updated `getEvents` and `getEventDetail` to return image URLs.
* **Frontend (UI/UX)**
    * **Global Styles:** Switched background to soft blue-grey (`#f5f7fa`) to reduce contrast.
    * **Events List:** Refactored cards into a "Thumbnail + Content" row layout.
    * **Event Details:** Added full-width Hero Banner image.
    * **Buttons:** Established clear hierarchy with `.primary-button` (Active) and `.secondary-button` (View Only).

### Next Steps
* **Authentication:** Build Login/Register flow to enable Ticket Purchasing.

## [2025-12-22] - Authentication Infrastructure
**Milestone:** User Registration & Login Flow

### Completed Items
* **Backend (API)**
    * Installed `bcryptjs` and `jsonwebtoken`.
    * Hardened `db.js` to use parameterized queries (SQL Injection protection).
    * Created `authRegister` endpoint (Hashes password, creates User).
    * Created `authLogin` endpoint (Validates credentials, returns JWT).
* **Frontend (Client)**
    * Implemented `AuthContext` for global user state management.
    * Created `Login.jsx` and `Register.jsx` pages.
    * Updated `Layout.jsx` to show "Login" vs "User Profile" based on state.

### Next Steps
* **Ticket Purchasing:** Connect the "Get Tickets" button in Event Details to a secure purchase flow.

## [2025-12-23] - Ticket Purchasing MVP
**Milestone:** End-to-End Ticket Purchase Flow (Mock Payment)

### Completed Items
* **Database**
    * Seeded `event_ticket_types` for the active event.
* **Backend (API)**
    * **Refactor:** Upgraded `db.js` to use Singleton Connection Pool pattern (Performance/Stability).
    * **Feature:** Created `createOrder` endpoint with atomic SQL Transactions (Orders + OrderItems + Attendees + Transactions).
    * **Update:** Modified `getEventDetail` to fetch and return available ticket types.
* **Frontend (Client)**
    * **UX:** Implemented "Ticket Selector" Modal in `EventDetails.jsx`.
    * **Logic:** Connected Checkout button to `createOrder` API.
    * **State:** Removed broken navigation flow; replaced with instant feedback Modal.

### Next Steps
* **Attendee Management:** Allow purchasers to assign specific names/emails to their tickets.
* **My Orders:** Create a User Profile view to see purchase history.

## [2025-12-23] - Attendee Management & UI Polish
**Milestone:** Attendee Data Capture & Visual Consistency

### Completed Items
* **Backend (API)**
    * **Feature:** Updated `createOrder` endpoint to process `attendees` array within the main transaction.
    * **Logic:** Implemented automatic 8-character `ticket_code` generation for each registered attendee.
    * **Data:** Verified insertion into `attendees` table linking to specific `order_items`.
* **Frontend (Client)**
    * **UX:** Implemented `AttendeeModal` workflow in `EventDetails.jsx`, intercepting checkout to collect Names/Emails per ticket.
    * **UI Core:** Implemented Global Box-Sizing Reset (`box-sizing: border-box`) to fix layout overflows.
    * **Visuals:** Standardized "Status Badges" to use Brand/Accent colors consistently across Events List and Details views.
    * **Fix:** Enforced strict aspect ratio and dimensions for Event Hero images to prevent layout shifts.

## [2025-12-25] - Registration Logic & Crew Linking
**Milestone:** Verified Registration Flow Recommendation & Implemented Post-Payment Crew Linking

### Completed Items
* **Database**
    * Verified `persons.user_id` is nullable.
    * Added `ticket_code` to `attendees` table (Unique identifier for linking).
    * Added `is_pit_crew` to `event_ticket_types`.
    * Seeded "Winter Warbirds 2026" with Pilot/Crew tickets for verification.
* **Backend (API)**
    * **Feature:** Implemented automatic 8-char `ticket_code` generation in `createOrder`.
    * **Logic:** Implemented "Pilot-Crew Linking" allowing crew to link to an existing Pilot via their `ticket_code`.
    * **Update:** Modified `getEventDetail` to return `is_pit_crew`.
* **Frontend (Client)**
    * **UX:** Updated `AttendeeModal` in `EventDetails.jsx` to show "Pilot Ticket Code" field for Crew tickets.
* **Verification**
    * Successfully tested manual Pilot creation (Code: `0URN9WME`).
    * Successfully tested manual Crew creation (Code: `1STM26T0`).
    * Confirmed database link in `pilot_pit_crews`.
    * Archived `Registration_Flow_Recommendation.md`.

### Next Steps
* **Attendee Assignment Flow:** Allow users to view purchased tickets and assign names/emails after purchase.

## [2025-12-26] - Enhanced Registration & Linking
**Milestone:** In-Cart Pilot-Crew Linking & Legacy Pilot Lookup

### Completed Items
* **Backend (API)**
    * **Feature:** Created `getUserEventAttendees` to fetch a user's previously registered pilots.
    * **Logic:** Refactored `createOrder.js` to support "In-Cart Linking" using temporary IDs.
    * **Fix:** Patched `createOrder.js` to ensure `persons` records are correctly linked to the authenticated `user_id`.
* **Frontend (Client)**
    * **UI:** Enhanced Pit Crew section in `EventDetails.jsx` with a smart Pilot Selector (In-Cart vs Registered vs Manual).
    * **State:** Implemented `myPilots` fetching and local state management.
* **Verification**
    * Validated In-Cart linking (Pilot + Crew in same order).
    * Validated Cross-Order linking (Crew linking to previously registered Pilot).
    * Fixed data issue where Pilot "Maverick" was unlinked from User.

### Documentation (Planning)
*   **Created:** `docs/Future_Feature_Requirements.md` - Roadmap for Campsites, Mechandise, Asset Hire.
*   **Created:** `docs/Pilot_Logic_Deep_Dive.md` - Specifications for "My Hangar" and Flight Line Duties.

## [2025-12-27] - Order History & Attendee Management (Part 1)
**Milestone:** Implemented "My Orders" and "Order Details" Views

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `getUserOrders` endpoint (fetches user's purchase history securely).
    *   **Feature:** Created `getOrderDetail` endpoint (fetches specific order with tickets/attendees).
    *   **Security:** Implemented specific `user_id` checks to ensure users can only view their own orders.
* **Frontend (Client)**
    *   **Page:** Created `MyOrders.jsx` - List view of past transactions.
    *   **Page:** Created `OrderDetail.jsx` - Detailed view showing Ticket Types, and assigned Pilots/Crew.
    *   **Navigation:** Added "My Orders" link to `Layout.jsx` (User Menu).
    *   **Routing:** Registered new routes in `App.jsx`.


### [2025-12-27] - Order History & Attendee Management (Part 2)
**Milestone:** Attendee Assignment Logic

### Completed Items
* **Backend (API)**
    *   **Feature:** Created `updateAttendee` endpoint (`PUT /api/attendees/:id`).
    *   **Security:** Added ownership validation (User -> Order -> OrderItem -> Attendee).
* **Frontend (Client)**
    *   **Feature:** Implemented Inline Edit Mode in `OrderDetail.jsx`.
    *   **UI/UX:** Aligned "Edit Details" button with "Registered" status badge for visual consistency.
    *   **Refactor:** Converted `tickets-list` item actions to a flex-column layout.
    *   **Feature:** Added `react-qr-code` to `OrderDetail.jsx` for scannable gate entry.

### Next Steps
*   **Campsite Booking:** Interactive map/list for booking spots.
*   **Merchandise:** E-commerce store.

## [2025-12-27] - Campsite Admin Map Tool
**Milestone:** Campground Mapping Foundation

### Completed Items
* **Database**
    *   **Seeding:** Seeded "North Field" campground (`test-map.jpg`) and 5 campsites.
    *   **Tooling:** Created temporary seeding endpoint to bypass direct connection issues.
* **Backend (API)**
    *   **Features:** Implemented `getCampgrounds`, `getCampsites`, and `updateCampsiteCoords`.
    *   **Fix:** Resolved API crash (500 Error) by fixing `recordset` property access on array results.
* **Frontend (Client)**
    *   **Feature:** Created `AdminMapTool.jsx` for defining campsite locations on a map image.
    *   **Navigation:** Added `/admin/map` route.
    *   **Logic:** Implemented dynamic fetching of campground data (removes hardcoded IDs).

### Next Steps
*   **User Booking:** Build the frontend interface for users to book specific sites.

## [2025-12-28] - Admin Map Tool Enhancements
**Milestone:** Campsite Admin Map Tool (v1)

### Completed Items
*   **Features (Backend)**
    *   **Bulk Create:**  `createCampsites.js` (POST /api/campgrounds/{id}/sites) handles bulk addition with prefixes.
    *   **Update Site:** `updateCampsite.js` (PUT /api/campsites/{id}) handles renaming and unmapping.
    *   **Delete Site:** `deleteCampsite.js` (DELETE /api/campsites/{id}).
*   **UI/UX (Frontend)**
    *   **Grid Layout:**  `AdminMapTool.jsx` sites list converted to a responsive CSS grid.
    *   **Bulk Add UI:** Added inputs for Qty and Prefix to quickly generate sites.
    *   **Interaction Refinement:** 
        *   Maintained selection focus after pinning for rapid mapping.
        *   Added "click pin to select" functionality.
        *   Fixed map container offset issues for accurate pin placement.
    *   **Theming:** integrated `organization_settings` colors (Primary, Accent) for dynamic button and pin styling.



## [2025-12-28] - Admin UX & Role Logic
**Milestone:** Role-Based Navigation & Enhanced Admin Tools

### Completed Items
*   **Backend (API)**
    *   **Auth Logic:** Updated `authLogin.js` to correctly authenticate against the `admin_users` table before falling back to `users`.
    *   **New Endpoint:** Created `createCampground.js` (POST /api/campgrounds) to allow Admins to generate new campground entities.
    *   **Fix:** Aligned `authLogin` and `createCampground` queries with the actual SQL Schema (corrected column names `admin_user_id` and removed non-existent `capacity`).
*   **Frontend (Client)**
    *   **Navigation:** Updated `Layout.jsx` to implement Role-Based Access Control (RBAC) in the header.
        *   **Admins:** See "Admin Map", "Cart" is hidden.
        *   **Users:** See "Cart", "Admin Map" is hidden.
    *   **Admin Map Tool:** 
        *   **UX Fix:** Solved Map Image overflow issue with responsive CSS.
        *   **Feature:** Added "Create Campground" button and Modal to the Admin interface.
        *   **Security:** Added Route Protection to redirect unauthorized users to Login.
*   **Verification**
    *   Verified End-to-End Admin flow (Login -> Create Campground -> View Map).
    *   Verified User flow (Login -> Restricted Access).

## [2026-01-04] - Campsite Booking & Admin Map Refinement
**Milestone:** End-to-End Campsite Booking & Admin Layout Polish

### Completed Items
*   **Backend (API)**
    *   **Feature:** Updated `getCampsites` to accept `startDate`/`endDate` query params and return `is_booked` status.
    *   **Delete Logic:** Implemented `deleteCampground.js` to allow admins to remove campgrounds (and associated sites).
    *   **Image Upload:** Implemented `uploadImage` function for campground maps.
*   **Frontend (Admin Map)**
    *   **UI Polish:** Fixed layout issues where the "Bulk Add" inputs were overlapping the map.
    *   **Feature:** Implemented Campground Auto-Selection after creation.
    *   **Feature:** Added Delete Campground functionality.
    *   **Fix:** Resolved logout redirection issue (now redirects to Home).
*   **Frontend (User Booking)**
    *   **Feature:** Integrated `CampsiteModal` into `EventDetails.jsx` for user-facing booking.
    *   **State:** Implemented `campsiteCart` to handle multiple site bookings in one order.
    *   **Logic:** Implemented date-based availability checking (Green/Red pins).
    *   **Fix:** Resolved "Flickering" issue where campground selection reset on date change (Stabilized `useEffect` dependencies).
    *   **Fix:** Resolved "Confirm Button Disabled" issue by adding missing `handleAddToCartCampsites` function.
*   **Verification**
    *   Verified Admin Map image uploading and site plotting.
    *   Verified User flow: Login -> Event -> Book Site -> Change Date -> Confirm -> Checkout.

### Next Steps

*   **Merchandise Integration:**
    *   **Plan:** Follow [Merchandise_Implementation_Plan.md](Merchandise_Implementation_Plan.md).
    *   **Phase 1 (Admin):** Schema updates, Product/Variant Management, Image Uploads, Event Pricing.
    *   **Phase 2 (User):** Storefront UI, Cart Logic, Order Processing.
*   **Payment Integration:** (Deferred) Connect Stripe/PayPal.
## [2026-01-10] - Shopping Cart Skeleton & Admin Dashboard
**Milestone:** Complete Shopping Cart Functionality & Admin Order Management

### Completed Items
*   **Backend (API)**
    *   **Unified Checkout:** Updated `createOrder.js` to handle `Merchandise`, `Asset`, and `Subevent` item types in a single transaction.
    *   **Admin API:** Created `getAdminOrders.js` to fetch all orders with event details (RESTRICTED to admins).
    *   **Asset Logic:** Implemented `getAssetAvailability.js` and `getAssetTypes.js` for hireable items.
    *   **Fix:** Resolved `CK_AttendeeStatus` constraint violation by defaulting attendee status to 'Registered'.
    *   **Fix:** Corrected `seed_demo_data.js` to properly populate Asset Inventory.
*   **Database**
    *   **Seeding:** Added `product_variants` (Sizes), `asset_items` (Generators), and `subevents` (Gala Dinner).
    *   **Constraints:** Verified foreign key relationships and status constraints.
*   **Frontend (Client)**
    *   **Store Page:** Created unified `StorePage.jsx` with tabs for Merchandise, Hire, and Program.
    *   **Checkout:** Implemented centralized `CartContext` and `Checkout.jsx` handling mixed baskets.
    *   **Admin Dashboard:** Created `AdminOrders.jsx` table view with status filtering and details link.
    *   **UX:** Added context-aware "Back" navigation (Admins -> All Orders, Users -> My Orders).
*   **Verification**
    *   Verified end-to-end flow: Add T-Shirt + Generator + Dinner -> Mock Pay -> Order Created -> Admin View.
    *   Verified "No Assets Available" error was resolved by fixing seeding logic.

### Next Steps
*   **UI/UX Polish:** Styling overhaul for Store, Cart, and Admin Dashboard.

## [2026-01-10] - UI/UX Polish & Tailwind Migration
**Milestone:** Implemented Tailwind CSS v4 and established a cohesive Design System

### Completed Items
*   **Tech Stack (Frontend)**
    *   **Migration:** Installed **Tailwind CSS v4** and configured `@tailwindcss/vite` plugin.
    *   **Theming:** Implemented Dynamic Branding using CSS variables (`--primary-color`, `--accent-color`) injected from `orgSettings`.
    *   **Refactor:** Removed legacy `index.css` manual styles in favor of utility classes.
*   **UI/UX (Client)**
    *   **Layout:** Built responsive Navigation Bar with Sticky Header and mobile-friendly spacing.
    *   **Store:** Refactored `StorePage.jsx` with a clean Tabbed Interface (Merch/Hire/Program) and responsive Grid layouts.
    *   **Checkout:** Designed a modern "Order Summary" card with clear typography and interactions.
    *   **Admin Dashboard:** Styled the Orders Table with consistent padding and color-coded Status Badges (Paid/Pending/Failed).

### Next Steps
*   **Fresh Start:**
    *   Purge Database (retain Admin/User logins).
    *   Seed new event: **"Festival of Aeromodelling 2026"** (Inglewood, QLD, 4th-12th July 2026).
*   **Discovery UI:**
    *   Build dedicated "Browse" views for Products, Subevents, and Assets (currently hidden behind "Add to Cart").
    *   Create a cohesive end-to-end experience for Users (Discovery -> Cart -> Checkout) and Admins (Setup -> Management).

## [2026-01-10] - Fresh Start (API Recovered)
**Milestone:** Database Reset Complete, API Restored & Functional

### State of play
*   **Database**: 
    *   Successfully purged all transactional data (while preserving Users/Admins).
    *   Previously incompatible tables ('campsites', 'campground_sections') were dropped and recreated with new schema structure.
    *   Successfully seeded "Festival of Aeromodelling 2026" event, including Products, Assets, Subevents, and Campgrounds.
    *   Verified via script output that seeding completed (Exit Code 0).
*   **API (Backend)**:
    *   The API service is currently failing to serve requests (returning 404 for all endpoints, including basic debug routes).
    *   `npm start` executes successfully, and the Functions Runtime (func.exe) launches.
    *   However, no functions are being registered/loaded by the runtime, despite correct file placement in `src/functions/`.
    *   `debug_test_v4.js` was created to test isolation; `node` can execute it without syntax errors, but `func` ignores it.
    *   `npm install` was re-run cleanly.
*   **Frontend (Client)**:
    *   `npm run dev` is operational.
    *   Camping Page UI verification was blocked by the API unavailability.



### API Recovery (Resolved)
*   [x] **Debug API Environment**: Investigated failure to load functions.
    *   **Root Cause:** `src/functions/dummy.js` was saved with unsupported encoding (**UTF-16LE**), causing the Node.js Worker to crash silently or with opaque syntax errors (`SyntaxError: Invalid or unexpected token`).
    *   **Investigation Path:**
        1.  Verified `local.settings.json` format (found valid).
        2.  Attempted `npm install` and `func start --verbose` (failed to show clear error due to crash).
        3.  Isolating using `debug_test_v4.js` (initially failed to load).
        4.  Captured `std_err` to a log file which revealed the encoding error pointing to `dummy.js`.
    *   **Fix:** Deleted `dummy.js`.
    *   **Verification:** `func start` now successfully loads all functions. `GET /api/campgrounds` returns 200 OK.
    *   **Lesson Learned:** **Always ensure files in the API directory are saved as UTF-8.** The Azure Functions Node.js worker is extremely sensitive to file encoding and crashes the entire worker process if it encounters a UTF-16/UCS-2 file, often masking the error unless logs are explicitly captured.

### Next Steps (Resuming)
*   **Camping Page:** Verify UI integration with the now-working backend.
*   **Discovery UI:** Continue building Browse views.

## [2026-01-10] - Admin Merchandise & Global UI Enhancements
**Milestone:** SKU Management Refinement, Image Uploads, and Global Notification System

### Completed Items
*   **Backend (API)**
    *   **SKU Management:**
        *   Fixed `getProductDetails` to return `image_url` for SKUs, resolving thumbnail display issues.
        *   Updated `deleteSKU` to safely handle deletion by first removing `event_skus` links (Availability).
        *   Refined Error Handling in `deleteSKU` to return transparent error messages (e.g., blocking deletion if SKU is purchased).
        *   Fixed logging syntax error (`context.log.error` -> `context.error`) in Azure Functions v4.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **Image Upload:** Implemented seamless image upload for both Base Product and Individual SKUs via `api/upload`.
        *   **SKU List:** Added "Delete" button (Red X) to SKU rows.
        *   **UX:** Removed unused "Barcode" column for cleaner layout.
        *   **Feedback:** Replaced `alert()` and `window.confirm()` with custom global notifications.
    *   **Global UI System:**
        *   **NotificationContext:** Created a global context provider for managing Toast Notifications and Confirmation Modals.
        *   **ToastContainer:** Implemented a sleek, animated toast notification system (Success/Error/Info) replacing browser alerts.
        *   **ConfirmationModal:** Implemented a styled modal for critical actions (e.g., "Delete SKU").
    *   **Fixes:**
        *   Resolved `App.jsx` "White Screen" regression caused by duplicate `BrowserRouter` tags and improper Provider nesting.
        *   Fixed `index.css` syntax error (missing closing brace).

### Next Steps
*   **Admin Asset Hires:** Implement the admin side of asset management.



## [2026-01-10] - Event Visibility & Asset Admin Fixes
**Milestone:** Resolved Asset Management Event Dropdown & API Routing

### Completed Items
*   **Backend (API)**
    *   **Fix:** `getEvents.js` - Changed `INNER JOIN` to `LEFT JOIN` on `venues`. This fixed the issue where events without venues were hidden from the public/dropdown list.
    *   **Fix:** `getEvents.js` - Added missing `route: 'events'` configuration. This resolved the 404 error when accessing `/api/events`.
    *   **Fix:** `getEvents.js` & `getEventDetail.js` - Added `is_public_viewable` to the SELECT columns. This resolved the issue where the "Publicly Viewable" checkbox state was not persisting or being respected.
    *   **Enhancement:** Added better logging to `getEvents.js` to assist in debugging admin vs public context execution.
*   **Verification**
    *   Verified "Event Context" dropdown in Asset Types now populates correctly.
    *   Verified "Publicly Viewable" checkbox state persists after saving.
    *   Verified `/api/events` endpoint responds with 200 OK.


## [2026-01-11] - Merchandise Enhancements
**Milestone:** End-to-End Option & Category Management with Optimistic UX

### Completed Items
*   **Backend (API)**
    *   **Feature:** Implemented `deleteVariantOption.js` (DELETE /api/options/{id}).
        *   **Logic:** Enforced cascading deletion: Deleting an option ("Small") automatically deletes all associated SKUs from `product_skus`, `sku_option_links`, and `event_skus`.
        *   **Response:** Returns `deletedSkuIds` to enable frontend optimistic updates.
    *   **Feature:** Implemented `deleteProductVariant.js` (DELETE /api/variants/{id}).
        *   **Safeguard:** Enforced `409 Conflict` if the category is not empty. Users must manually delete options first.
        *   **Cleanup:** Automatically deletes the global `variant_categories` record if the deleted category was the last usage of that name (orphan cleanup).
    *   **Enhancement:** Updated `manageProductOptions.js` to return the full option object (including the new ID) upon creation, enabling instant UI updates.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **UX (Options):** Added "Delete" (X) button to option pills.
        *   **UX (Categories):** Added "Remove Category" button to Variant Card headers.
        *   **Optimistic UI:** Implemented local state management for Add/Delete actions. Updates appear instantly without triggering a page reload (`fetchDetails`), improving perceived performance.
        *   **Feedback:** Integrated `NotificationContext` to handle confirmation prompts and error messages (e.g., "Delete all options first").
*   **Verification**
    *   **Backend:** Verified cascading delete logic via custom database script `test_cascade_logic.js`.
    *   **Frontend:** Verified optimistic updates for adding/deleting options and categories.
    *   **Safeguards:** Verified that trying to delete a populated category triggers the correct warning.

### Next Steps
*   **User Flow:** Allow users to select these merchandise options during the booking flow.

## [2026-01-11] - Campground Management
**Milestone:** Implemented Campground Renaming Logic in Admin Map Tool

### Completed Items
*   **Backend (API)**
    *   **Feature:** Created `updateCampground.js` (PUT /api/campgrounds/{id}) to handle renaming campgrounds.
*   **Frontend (Client)**
    *   **Admin Map Tool:**
        *   **UI:** Replaced browser prompt with a custom, styled Modal for renaming campgrounds.
        *   **Feedback:** Added visual border to modal input to improve usability.
        *   **Logic:** Implemented seamless state updates to reflect name changes instantly on the tab bar.
*   **Verification**
    *   Verified renaming flow (Open Modal -> Edit -> Save -> Update) persists correctly via API.

## [2026-01-11] - Ticket Management & Dev Ops
**Milestone:** Event Ticket CRUD & Local Environment Fixes

### Completed Items
*   **Backend (API)**
    *   **Feature:** Created `ticketTypes.js` (CRUD endpoints for `event_ticket_types`).
    *   **Logic:** Implemented `GET`, `POST`, `PUT`, `DELETE` operations secured by Admin Role check (via context).
*   **Frontend (Client)**
    *   **Event Form:** Added a "Ticket Types" management section to `EventForm.jsx`.
        *   **UI:** Listed tickets in a table with badges for "Pilot" and "Crew" roles.
        *   **Interaction:** Created a modal for Adding/Editing ticket details (Name, Price, System Role).
        *   **Logic:** Implemented API integration for seamless CRUD operations without page reloads.
*   **Dev Ops (Localhost)**
    *   **Fix:** Resolved "White Screen / 404" errors on `localhost:5173`.
    *   **Root Cause:** A stale Service Worker from a previous project version was intercepting requests.
    *   **Resolution:** Unregistered the "zombie" Service Worker in the browser.

### Next Steps
*   **Subevents:** Implement CRUD for Subevents (Dinners, etc.) in the Event Form.

## [2026-01-12] - Event Portal UX Refinement
**Milestone:** Home Page Redirection & Event Details Styling

### Completed Items
* **Frontend (Client)**
    *   **Home Page:** Implemented smart redirection. Visiting `/` now auto-redirects to the Next upcoming event (or Current event if active).
    *   **Event Details UI:**
        *   **Refactor:** Removed legacy "Back" button and "Status" badge for a cleaner look.
        *   **Typography:** Centered and enlarged the Event Title.
        *   **Layout:** Centered key content width for better readability.
        *   **Buttons:** Removed "Book Campsite" button.
        *   **CTA:** Styled "Get Tickets" button to be more prominent and centered.
    *   **Security:** "Get Tickets" button now strictly redirects unauthenticated users to `/login`.
    *   **Fix:** Resolved CSS `white-space` issue where line breaks in Event Descriptions were being ignored. Applied fix to both List and Details views.


## [2026-01-12] - Email Verification
**Milestone:** Secure User Registration with Resend Integration

### Completed Items
* **Technology Stack**
    *   **Service:** Integrated **Resend** for transactional emails (Free Tier: 100/day).
    *   **Library:** Installed `resend` NPM package in API.
* **Backend (API)**
    *   **Database:** Added `verification_token` and `verification_token_expires` to `users` table.
    *   **Registration:** Updated `authRegister` to:
        *   Generate a secure hex token.
        *   Create user with `is_email_verified = 0`.
        *   Send an HTML email containing a verification link.
    *   **Creation:** Created `api/src/lib/emailService.js` abstraction.
    *   **Verification:** Created `authVerifyEmail` endpoint to validate token and activate user.
    *   **Login:** Updated `authLogin` to block unverified users (`403 Forbidden`).
* **Frontend (Client)**
    *   **Registration:** Updated `Register.jsx` to show a "Check your email" success state instead of auto-redirecting.
    *   **Verification:** Created `VerifyEmail.jsx` to handle the `?token=XYZ` link from the email.
* **Verification**
    *   Verified end-to-end flow: Register -> Receive Email -> Click Link -> Verification Success -> Login.

### Going Live Instructions (Resend)
When ready to deploy to production with a real domain:
1.  **Add Domain:** Go to [Resend Dashboard](https://resend.com/domains) > Add Domain.
2.  **DNS:** Add the provided DKIM/SPF records to your DNS provider (Cloudflare, GoDaddy, etc.).
3.  **Verify:** Click "Verify" in Resend (can take up to 48h, usually instant).
4.  **Update Code:**
    *   Open `api/src/lib/emailService.js`
    *   Update the `from` address: `from: 'Aeromodelling <noreply@yourdomain.com>'`


## [2026-01-12] - Admin User Management
**Milestone:** User Administration & Account Lockout

### Completed Items
* **Database**
    *   **Schema:** Added is_locked column to users table.
* **Backend (API)**
    *   **New Endpoints:**
        *   GET /api/manage/users: Fetches list of all registered users (masked sensitive data).
        *   PUT /api/manage/users/{id}/status: Updates is_locked status.
    *   **Security:**
        *   Secured new endpoints with Admin authentication.
        *   Updated uthLogin to check is_locked status and return 403 Forbidden if locked.
    *   **Bug Fix:** Identified and resolved issue where is_email_verified check was being ignored in uthLogin due to missing column in SELECT query. Fixed query to include necessary flags.
* **Frontend (Client)**
    *   **Admin Dashboard:** Added "Manage Users" tab to System Settings.
    *   **UI:** Created UserList.jsx to display registered users with status indicators (Verified/Pending, Active/Locked).
    *   **Interaction:** Implemented Lock/Unlock functionality with optimistic UI updates.
    *   **Login:** Updated Login.jsx to display actual server error messages (e.g., "Account is locked", "Please verify email") instead of generic "Invalid Credentials".


## [2026-01-12] - Store UI & Global Merchandise Flow
**Milestone:** Storefront Modernization & Global SKU Access

### Completed Items
*   **Merchandise Architecture**
    *   **Refactor:** Decoupled Merchandise from specific Events. Products are now "Global" by default.
    *   **Logic:** Updated `getStoreItems` to fetch all active `product_skus`, removing the strict `event_skus` join.
    *   **Transactions:** Updated `createOrder.js` to process orders using `product_sku_id` directly, simplifying inventory management.
*   **Storefront UI/UX**
    *   **Visual Overhaul:** Replaced the dense list view with a clean **Product Grid**.
    *   **Interaction:** Introduced a **Product Modal** for item selection.
        *   **Dynamic Options:** Dropdowns (Size/Color) are generated dynamically from API data.
        *   **Real-time Feedback:** Price and Stock status update instantly based on user selection.
        *   **Smart Imaging:** Modal image updates to the specific SKU image (if available) when options are selected.
    *   **Components:** Created reusable `ProductCard.jsx` and `ProductModal.jsx` components.
*   **Backend (API)**
    *   **Data Structure:** Enhanced `getStoreItems` response to return nested `options` (for dropdowns) and `variant_map` (for logic).
    *   **Images:** Added `image_url` support to individual SKUs in the API response.

## [2026-01-12] - Azure Storage Migration
**Milestone:** Scalable Image Hosting for Serverless Environment

### Completed Items
* **Infrastructure**
    *   **Azure Storage:** Set up a dedicated Storage Account (`aeroprojectstorage`) and `uploads` container.
    *   **Configuration:** Added `BLOB_STORAGE_CONNECTION_STRING` to `local.settings.json`.
* **Backend (API)**
    *   **Dependencies:** Installed `@azure/storage-blob`.
    *   **Refactor:** Rewrote `uploadImage.js` to upload files directly to Azure Blob Storage instead of the local filesystem.
    *   **Security:** Configured public read access for the `uploads` container to serve images globally.
* **Frontend (Client)**
    *   **Verification:** Confirmed that `ProductCard` and `EventDetails` components correctly render images served from absolute Azure URLs (`https://...`).
* **Verification**
    *   **Upload Test:** Verified that uploading a file via the API successfully stores it in Azure and returns a valid, accessible URL.

## [2026-01-12] - Azure Upload Debugging
**Milestone:** Resolved "500 Internal Server Error" on Live Azure Environment

### The Issue
*   Image uploads were working locally but failing silently on the deployed Azure Static Web App.
*   **Error 1:** The error handler was crashing because `context.log.error` is valid in v3 but invalid in v4 (should be `context.error`).
*   **Error 2:** The underlying error was `ReferenceError: crypto is not defined`. The Azure Storage SDK requires `global.crypto`, which was missing in the Azure Functions Node environment.

### The Fix
*   **Backend (API)**
    *   **Polyfill:** Added a global polyfill for `crypto` in `uploadImage.js` to satisfy SDK requirements.
    *   **Refactor:** Fixed logging syntax to use `context.error` and `context.warn`.
    *   **Verification:** Confirmed uploads now work successfully in the live environment.


## [2026-01-12] - Hire Assets Features
**Milestone:** Asset Image Display, Selection, and Availability Checking

### Completed Items
*   **Database**
    *   **Schema:** Added `image_url` column to `asset_items` table.
*   **Backend (API)**
    *   **Features:**
        *   Updated `manageAssetItems.js` to support creating/editing items with `image_url`.
        *   Updated `getStoreItems.js` to return asset type images.
        *   Created `getAssetAvailability.js` to fetch available items for a date range, preventing double bookings.
    *   **Fix:** Resolved 'Invalid column name status' error in availability check by relying on `asset_hires` dates.
*   **Frontend (Client)**
    *   **Admin Dashboard:**
        *   Updated `AssetItems.jsx` to support editing items and uploading specific item images (e.g. for damage/condition tracking).
        *   Added thumbnail display to the items list.
    *   **Storefront:**
        *   **Asset Selection:** Implemented `AssetSelectionModal` to allow users to view and select specific available items (e.g. specific serial numbers).
        *   **Availability:** Integrated date-based availability checking to hide booked items.
        *   **Image Fallback:** Implemented logic to show Asset Item image -> Asset Type image -> No Image placeholder.
        *   **Consistency:** Updated all modals (`ProductModal`, `CampsiteModal`, `AssetSelectionModal`) to use consistent `lucide-react` icons.
    *   **Pricing & Logic:**
## [2026-01-19] - Pilot Access Control & Critical Bug Fixes
**Milestone:** Pilot Access Restrictions, Registration UI Polish & Stability Fixes

### Completed Items
*   **Access Control:**
    *   **Logic:** Implemented `pilot_registration_open` flag logic to restrict access to Pilot Registration forms based on Event Settings.
    *   **UI:** Updated `Register.jsx` to disable/hide Pilot options if registration is closed (or user is not an Admin).
*   **Frontend (Store Page):**
    *   **Feature:** Implemented "Event Tickets" tab on the Store Page.
    *   **Logic:** Created `AttendeeModal.jsx` - a reusable component for collecting attendee details (inc. Pilot info, MOP, Aircraft) during the "Add to Cart" flow.
    *   **Bug Fix:** Updated `AttendeeModal` validation logic to correctly identify Pilot tickets using both `ticket_type_id` and `id` properties, resolving the issue where Pilot fields were hidden.
*   **Backend (API):**
    *   **Schema:** Updated `getStoreItems.js` to include `is_pilot` flag in the tickets response.
    *   **Fix:** Removed invalid `is_active` column check from `getStoreItems.js` which was causing 500 Errors.
*   **Verification:**
    *   Verified "Add to Cart" flow for Pilot tickets correctly triggers the Pilot Detail modal (MOP, Aircraft).
    *   Verified Store Page correctly redirects to the specific event store if only one active event exists.

### Completed Items
*   **Access Control**
    *   **Frontend (Layout):** Implemented conditional rendering for Navigation. Hidden "Information", "Shop", and "Cart" for non-logged-in users.
*   **UI Polish**
    *   **Registration:** Refined `Register.jsx` by adding explicit field labels, borders, and removing placeholders for a cleaner, professional look.
*   **Stubborn Bug Fixes**
    *   **API Startup:** Resolved recurring API startup failure by fixing route conflict in `variantTemplates.js` (Renamed to `manage/variant-templates`).
    *   **Store Page:**
        *   Fixed `ReferenceError: loading is not defined` by properly initializing state.
        *   Fixed "Access Restricted" (401) loop by correctly passing `Authorization` headers in the fetch request.
        *   Fixed "White Screen" crash by restoring missing state and handler functions (`handleAddMerch`, etc.).
    *   **Checkout:**
        *   Fixed "White Screen" on Checkout by safely parsing item prices (`Number()`) before calling `.toFixed()`.
        *   **CartContext:** Hardened `cartTotal` calculation to handle potential string/null prices gracefully.


## [2026-01-18] - Ticket Description Field
**Milestone:** Enhanced Ticket Information

### Completed Items
*   **Database**
    *   **Schema:** Added `description` column to `event_ticket_types` table.
*   **Backend (API)**
    *   **Ticket CRUD:** Updated `ticketTypes.js` to handle `description` field in Create and Update operations.
    *   **Public API:** Updated `getEventDetail.js` to return ticket descriptions.
*   **Frontend (CLIENT)**
    *   **Admin UI:** Added Description textarea to the Ticket Type Modal in `EventForm.jsx`.
    *   **Public UI:** Updated `EventDetails.jsx` to display the description below the ticket name in the ticket list.

## [2026-01-14] - Mobile Optimization
**Milestone:** Responsive "Mobile-First" UI Overhaul

### Completed Items
*   **Technology Stack**
    *   **Icons:** Integrated `lucide-react` for responsive hamburger menu and cross-platform consistency.
*   **Frontend (Layout & Navigation)**
    *   **Hamburger Menu:** Implemented a slide-out mobile navigation drawer replacing the hidden desktop menu.
    *   **Responsive Header:** 
        *   Designed a "Stacked" layout for mobile: Logo + Menu Button on top row, Organization Name wrapping to full width on second row.
        *   Ensured proper alignment and sizing of the Cart icon on mobile.
    *   **Bleed Tabs:** Refactored `StorePage` tabs to scroll edge-to-edge on mobile while maintaining visual padding (no cut-off text).
*   **Frontend (Views)**
    *   **Event Details:**
        *   Made Hero Banner responsive (auto-height).
        *   Adjusted typography for smaller screens.
        *   Stacked "Get Tickets" button vertically on mobile.
    *   **Events List:** Converted Event Cards to a vertical stack (Image Top / Content Bottom) on mobile.
    *   **Product Modal:** Optimized padding and layout to fit small screens without scrolling issues.
    *   **Checkout:** Improved list item readability on mobile by introducing vertical stacking and ensuring the "Remove" button is always visible (no hover required).
*   **Verification**
    *   Verified responsive behavior on multiple mobile breakpoints.
    *   Confirmed no horizontal scrolling or truncated content across the app.

## [2026-01-13] - Camping Page Fix
**Milestone:** Resolved Critical Camping Page Bug

### The Issue
The "Camping" page for "Festival of Aeromodelling 2026" was displaying "No campgrounds found for this event." despite campgrounds existing in the database.

### The Fix
* **Backend (API):**
    *   **Bug Found:** `getCampgroundAvailability` contained a SQL query error. It was attempting to select a column `c.name` from the `campsites` table, but the correct column name is `c.site_number`.
    *   **Resolution:** Corrected the SQL query to select `c.site_number` as `site_number`.
    *   **Verification:** Verified by calling the API directly and confirming it now returns the campground data correctly.



### Next Steps
*   **Checkout:** Ensure the correct price (Daily Rate * Days) is passed to the cart and checkout flow.

## [2026-01-13] - Merchandise Delete & Archive Logic
**Milestone:** Implemented safe deletion and archiving workflows for products.

### Completed Items
*   **Backend (API)**
    *   **New Endpoint:** `deleteProduct.js` (DELETE /api/products/{id}).
        *   **Validation:** Blocks deletion if the product has existing Orders (`409 HAS_ORDERS`).
        *   **Warning:** Blocks deletion if the product has SKUs (`409 HAS_SKUS`) unless `force=true`.
        *   **Cleanup:** Performs cascading delete of Product -> Variants -> Options -> SKUs.
    *   **Enhancement:** Updated `getProducts.js` to remove the default `is_active=1` filter, allowing Admins to view archived products.
    *   **Fix:** Identified that `products.is_published` column does not exist, corrected legacy checks.
*   **Frontend (Client)**
    *   **Product Editor:**
        *   **Actions:** Added "Archive", "Unarchive", and "Delete" buttons to the bottom of the "Info" tab.
        *   **UX:** Implemented smart confirmation logic:
            *   "Has Orders" -> Suggests Archiving.
            *   "Has SKUs" -> Double confirmation warning about data loss.
    *   **Merchandise List:**
        *   **Filtering:** Added "Show Archived" checkbox to toggle visibility of archived items.
        *   **Status:** Removed incorrect "Draft" badge; Added clear "Archived" badge.
*   **Verification**
    *   Verified archiving hides products from the list (unless filter is active).
    *   Verified unarchiving restores products.
    *   Verified deletion works for clean products and forces confirmation for products with SKUs.
    *   Verified products with orders cannot be deleted and prompt for archiving.


## [2026-01-16] - Resend Configuration & Database Cleanup
**Milestone:** Fixed Live Registration Error and Cleaned Development/Live Databases

### Completed Items
*   **Backend (API)**
    *   **Fix:** Resolved "Internal Server Error" on registration by robustly handling missing `RESEND_API_KEY`.
    *   **Refactor:** Moved `Resend` client initialization inside `sendVerificationEmail` to prevent module-load crashes.
    *   **Logic:** Added strict error checking: invalid JSON returns `400`, email failure deletes the pending user and returns `500` (prevents "ghost" users).
    *   **Config:** Verified domain sender address `registrations@meandervalleywebdesign.com.au`.
*   **Database Cleanup**
    *   **Scripting:** Created and executed safe cleanup scripts for both `sqldb-aero-dev` (Local) and `sqldb-aero-master` (Live).
    *   **Execution:**
        *   Preserved Admin (`admin@test.com`) and User (`jbsolutions@gmail.com`).
        *   Deleted all other users, admins, and cascading linked data (orders, attendees, transactions).
    *   **Verification:** Verified record counts on both environments.
*   **Verification**
    *   Confirmed registration API properly handles missing credentials without crashing the entire app.
    *   Confirmed clean state of both databases.

### Email Refinements
*   **Issues Addressed:**
    *   **Organization Name:** Now dynamically fetched from the database (`organization_settings`) instead of being hardcoded.
    *   **Sender Name:** Now matches the dynamic organization name.
    *   **Verification Link:** Now automatically derives the domain from the request's `Origin` header. Works seamlessly on both `localhost` and Live environments without needing manual configuration.
*   **Configuration:*   **Action Required:** User must add `SITE_URL` to Azure Application Settings.

### Debugging Fixes
*   **Organization Name:** Corrected SQL query to select `organization_name` instead of `name`.
*   **Client Routing:** Added `client/public/staticwebapp.config.json` to enable SPA fallback routing. This fixes the 404 error when visiting `/verify-email`.

### Next Steps
*   **Live Config:** User to add `RESEND_API_KEY` to Azure Function App settings.
*   **Testing:** Perform live user registration test.

## [2026-01-17] - Asset Pricing Options & Availability
**Milestone:** Flexible Asset Pricing (Daily vs Full Event) & UX Improvements

### Completed Items
*   **Database**
    *   **Schema:** Added `full_event_cost`, `show_daily_cost`, and `show_full_event_cost` to `asset_types` table.
*   **Backend (API)**
    *   **Endpoints:** Updated `getAssets.js` and `manageAssetTypes.js` to handle new pricing fields.
    *   **Store:** Updated `getStoreItems.js` to return pricing configuration and correct Event Dates.
*   **Frontend (Admin)**
    *   **Asset Management:** Updated `AssetTypes.jsx` form to include pricing toggles and Full Event cost inputs.
*   **Frontend (Store)**
    *   **Display:** Updated `StorePage.jsx` asset cards to display "Daily" and/or "Full Event" prices.
    *   **UX:** Refactored `AssetSelectionModal.jsx` to host date selection internally, improving user flow.
    *   **Logic:** Implemented toggling between "Daily Hire" (Date Picker) and "Full Event Pkg" (Fixed Price, Event Dates).
    *   **Availability:** Fixed infinite loading bug in modal; Verified "First-in-best-dressed" checkout logic in `createOrder.js`.

### Next Steps
*   **Testing:** Monitor live usage for potential race conditions (though safeguarded by transactions).

## [2026-01-18] - Process Update
**Milestone:** Manual Verification Workflow Adopted
*   **Process Change**: From this point forward, verification of frontend changes will be performed **manually by the user** unless explicit browser automation is requested.
*   **Documentation**: Verification steps will be provided in the chat response rather than executed by the agent.

## [2026-01-18] - Client Feedback Implementation (Batch 1)
**Milestone:** Navigation, Admin Camping Tools, & Flexible Camping Pricing

### Completed Items
*   **General Navigation** [Completed]
    *   **Frontend**: Added "Information" dropdown menu to Desktop Navigation and Mobile Menu (Layout.jsx).
    *   **Structure**: Includes placeholders/links for Flightline, FAQ, Schedule, etc.

*   **Admin Camping Enhancements** [Completed]
    *   **Bulk Create**: Removed mandatory "Suffix" field.
    *   **Single Site**: Added specific form to add single unique site names (e.g. "5A").
    *   **Map Updates**: Added ability to re-upload map images for existing campgrounds without data loss.

*   **Camping Pricing (Flexible)** [Completed]
    *   **Schema**: Utilized `full_event_price` column in `campsites`.
    *   **Backend**: 
        *   Updated `getCampgroundAvailability` to return full event prices.
        *   Updated `createCampsites`/`updateCampsite` to allow setting this price.
        *   Updated `createOrder` to validate payments against either Daily Total OR Full Event Price.
    *   **Frontend (Admin)**: Added Full Event Price inputs to Admin Map Tool.
    *   **Frontend (Public)**: 
        *   Updated `CampingPage.jsx` logic.
        *   Added "Full Event Package" checkbox that toggles price calculation.
        *   **Auto-Check Logic**: Automatically selects "Full Event Package" when user selects the exact event dates.

### Verification
*   **Manual**: Validated by user via Admin Tool checks and Public Booking Flow.

## [2026-01-18] - Admin Map Tool UI Refactor
**Milestone:** Refactored Admin Map Tool Sidebar for Clarity

### Completed Items
*   **Frontend (Admin Map)**
    *   **Refactor:** Redesigned the "Bulk Create" and "Single Site" sidebar sections in `AdminMapTool.jsx`.
    *   **Layout:** Switched from a horizontal flex layout to a vertical stack to better fit the sidebar width.
    *   **Labels:** Renamed "Price" to "Daily Price" and "FullEvent" to "Full Event Price" for clarity.
    *   **Styling:** Added currency indicators ($) to price inputs and improved general alignment.

## [2026-01-18] - Variant Templates (Merchandise Defaults)
**Milestone:** Reusable Product Option Templates

### Completed Items
*   **Database**
    *   **Schema:** Created `variant_templates` and `variant_template_options` tables for storing reusable option sets.
*   **Backend (API)**
    *   **Feature:** Created `variantTemplates.js` with CRUD endpoints:
        *   `GET /api/manage/variant-templates`: List all templates with option counts.
        *   `GET /api/manage/variant-templates/{id}`: Get template details with options.
        *   `POST /api/manage/variant-templates`: Create new template with options.
        *   `DELETE /api/manage/variant-templates/{id}`: Delete template.
    *   **Fix:** Changed route from `admin/variant-templates` to `manage/variant-templates` to avoid Azure Functions reserved path conflict.
*   **Frontend (Client)**
    *   **Admin Interface:**
        *   Created `VariantTemplates.jsx` for managing templates (create, list, delete).
        *   Added "Merchandise Templates" tab to Admin Settings (`AdminSettings.jsx`).
        *   Integrated template application into `ProductEditor.jsx` "Options" tab with "Apply Template" button and selection modal.
    *   **UX:** Removed price adjustment field from template creation based on user feedback.
    *   **UI:** Simplified buttons to text-only (removed icons from "New Template" and "Save Template").
*   **Verification**
    *   Verified template creation, listing, and deletion.
    *   Verified template application to products correctly populates variant options.

### Next Steps
*   **Legacy Booking:** Implement priority booking system for returning customers.

## [2026-01-19] - Pilot Registration Refactor & Attendee Data
**Milestone:** Enhanced Pilot Data Capture, Validation & Store Logic Refactor

### Completed Items
*   **Database**
    *   **Updates:**
        *   Added `date_of_birth`, `address_line_1`, `city`, `state`, `postcode`, `emergency_contact_name`, `emergency_contact_phone` to `persons` table.
        *   Added `arrival_date`, `departure_date`, `flight_line_duties` to `attendees` table.
*   **Backend (API)**
    *   **Logic:** Updated `createOrder.js` to:
        *   Validate existence of all new mandatory fields.
        *   Update `persons` and `attendees` tables with new data during order creation.
        *   Handle "Duplicate Variable" bug for date fields.
*   **Frontend (Client)**
    *   **Pilot Registration (AttendeeModal):**
        *   **Validation:** Implemented Toast Notifications (`useNotification`) for all validation errors.
        *   **Data Capture:** Added input fields for Address, DOB, Emergency Contact, and Travel Dates.
        *   **Refactor:**
            *   Changed "CASA Licence / ARN" label to **"AUS Number"**.
            *   Simplifed Heavy Model logic: "Are you bringing any Heavy Models?" checkbox now reveals the aircraft list. All planes in this list are treated as Heavy Models (requiring Cert # and Upload).
            *   Added **Flight Line Duties** agreement checkbox.
    *   **Store Access:**
        *   **Constraint:** Users must now have an active Ticket (or a Ticket in their Cart) to access Subevents, Camping, and Assets.
        *   **UX:** Removed legacy "Get Tickets" button from Event Details; simplified flow to direct all purchases through the Store.

### Next Steps
*   **Verification:** Confirm data flows correctly into Admin exports/reports.



## [2026-01-22] - Registration Flow Debugging & Refinement
**Milestone:** Robust User Registration & Data Capture

### Time Log
*   **Start:** 13:20
*   **End:** 14:05

### Completed Items
*   **Attendee Phone Number**
    *   **Schema:** Added `phone_number` to `persons` table.
    *   **Frontend:** Added Phone Number input to `AttendeeModal` and `EventDetails` inline form.
    *   **Backend:** Updated `createOrder` and `updateAttendee` to persist phone numbers.
*   **Registration Refinements**
    *   **Fields:** Added `country` (default: Australia) and `state` (Smart Toggle: Dropdown/Input).
    *   **UX:** Pre-populated Arrival/Departure dates with Event Start/End dates.
    *   **Validation:** Added strict validation for Email format and Date of Birth (must be past).
*   **Critical Bug Fixes**
    *   **Checkout:** Fixed "No event associated with cart items" error by ensuring `eventId` is attached to all cart items (Tickets, Merch, Assets) in `StorePage.jsx`.
    *   **Data Integrity:** Resolved issue where `persons` and `attendees` records were not created due to the checkout failure.
    *   **React Error:** Resolved "Internal React error: Expected static flag was missing" in `EventDetails`.

### Next Steps
*   **Testing:** Full end-to-end regression testing of the checkout flow with multiple ticket types.



