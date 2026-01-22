# Overhaul Order Details Page

## Goal Description
Redesign the **Order Details** page (`/my-orders/:id`) to match the clarity of the Checkout Summary.
Currently, non-ticket items (Assets, Campsites) are incorrectly labeled as "Tickets" because the API defaults to the linked Attendee's ticket name. The UI also incorrectly treats every item as an "Attendee" to be edited.

## User Review Required
> [!NOTE]
> The new design will separate **Order Summary** (What you bought) from **Attendee Management** (Who is going).

## Proposed Changes

### Backend (API)
#### [MODIFY] [getOrderDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getOrderDetail.js)
-   Update the SQL query to `LEFT JOIN` additional tables:
    -   `campsites` (Campsite)
    -   `subevents` (Subevent)
    -   `asset_items` & `asset_types` (Asset)
-   Implement logic to select the correct `item_name` based on `order_items.item_type`.
-   Select additional details (Check-in dates, variant names) for display.

### Frontend (Client)
#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
-   **New Section: Order Summary**:
    -   A clean list/table at the top showing all items (Name, Type Badge, Price, Details like dates/options).
    -   Match the visual style of the `Checkout.jsx` summary.
-   **Modified Section: Tickets & Attendees**:
    -   Filter the existing "Attendee Card" list to **only** show items where `item_type === 'Ticket'`.
    -   This is where users assign Names/Emails/Licenses.
    -   Hide the edit controls for non-ticket items (they don't have separate attendees usually).

## Verification Plan

### Automated Tests
-   None.

### Manual Verification
1.  **View Order**: Go to "My Orders" and click the content of the problematic order (Order #1005?).
2.  **Verify Summary**:
    -   Check the top section lists the actual items:
        -   "Generic Generators" (Asset)
        -   "Site ttt8" (Campsite)
        -   "Presentation Dinner" (Subevent)
        -   "Festival 2026 T-Shirt" (Merch)
        -   "MAAA Pilot Registration" (Ticket)
    -   Verify details (Dates, Sizing) appear correctly.
3.  **Verify Attendees**:
    -   Check the bottom section only lists the **Ticket** (Pilot Registration).
    -   Verify you can still edit the Pilot's name/email.
4.  **Verify Edit**:
    -   Change the Pilot's name and Save. Ensure it persists.
