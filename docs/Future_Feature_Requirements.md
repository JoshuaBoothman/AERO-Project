# Future Feature Requirements: Core Modules

This document outlines the roadmap for the remaining "Product" modules.

## 1. Event Registration (Continued)
*   **Ticket Logic:** Continues to use the core `cart` and `createOrder` flow.
*   **Pilot/Plane Logic:** Moved to dedicated document: [Pilot Logic Deep Dive](Pilot_Logic_Deep_Dive.md).
    *   Includes: "My Hangar", Multiple Planes, and Flight Line Duties.

## 2. Campsite Booking
**Tables:** `campgrounds`, `campsites`, `campsite_bookings`

*   **Concept:** Users book a physical space for accommodation.
*   **Selection Mode:**
    *   **Map Based (Preferred):** Interactive map where users click a specific site (e.g., "Site A1").
    *   **List Fallback:** If no map image/coordinates provided by Admin, show a simple list of available site names.
*   **Occupancy:**
    *   **Multiple Attendees:** A single campsite booking can be linked to multiple Attendees (e.g., a family of 4 sharing "Site B2").
    *   **No Role Restrictions:** Any ticket holder can camp (unless specifically restricted by Admin, but generally open).

## 3. Subevent Registration
**Examples:** Qualification Workshops, Gala Dinners, Safety Briefings.

*   **Concept:** Add-on tickets/registrations for specific scheduled activities.
*   **Key Logic:**
    *   **Attendee Linking:** Must link to a specific *Attendee* (Person).
    *   **Capacity:** Strict limits (e.g., "Dinner Hall holds 200").
    *   **Time Conflict Checks:**
        *   **Subevent vs Subevent:** Cannot be in two places at once.
        *   **Subevent vs Duties:** Cannot attend Dinner if rostered for Flight Line Duty (see Pilot Doc).

## 4. Merchandise Store
**Tables:** `products`, `product_skus`, `variant_categories`, `variant_options`, `sku_option_links`

*   **Concept:** E-commerce flow for physical goods.
*   **Variant Logic:**
    *   Products have Options (Size, Color).
    *   SKUs represent the specific combination (e.g., "T-Shirt - Large - Red").
    *   Inventory is tracked at the SKU level.
*   **Fulfillment:**
    *   **Pickup Only:** No shipping logic required. Users collect at the event "Merch Tent".

## 5. Asset Hire
**Tables:** `asset_hires`, `asset_items`, `asset_types`

*   **Concept:** Hiring operational equipment (Tables, Chairs, Weights, Cables).
*   **Logic:**
    *   **Stock Tracking:** Pool of items (e.g., "50 Chairs available").
    *   **Deposits:** Handling refundable security bonds.
    *   **Check-in/Out:** Operational flow for handing out items and marking them returned.

---

## 6. Operational Logic (Gate & Compliance)

### 6.1 Waivers
*   **Trigger:** Checkout success or First Login after purchase.
*   **Storage:** Digital signature blob or boolean `is_signed` + timestamp/ip.
*   **Gate Enforce:** "Cannot check in if Waiver not signed".

### 6.2 Gate Check-in
*   **QR Codes:** Unique per attendee (Ticket Code).
*   **Action:** Mobile-first scanner app updates `attendees.status` to 'Checked In'.
