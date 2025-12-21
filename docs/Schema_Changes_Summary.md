AERO Schema Changes Summary

1. Organization & Configuration (organization_settings)

Add Column: accent_color (VARCHAR(7), Default: '#FFD700').

Add Column: is_gst_registered (BIT, Default: 0). Used to calculate tax on invoices.

2. Venues & Events

Venues Table:

Add Column: map_url (NVARCHAR(500), NULL). Link to permanent airfield map/safety layout.

Clarification: timezone is critical for UI logic.

Events Table:

Add Feature: "Clone Event" functionality (Logic, not schema) to copy settings, subevents, and assets from previous years.

New Table: event_ticket_types

Purpose: Handles custom pricing for "Pilot", "Spectator", "Early Bird", etc.

Columns: ticket_type_id (PK), event_id (FK), name, price, system_role (Enum: 'Pilot', 'Spectator', 'Crew').

3. Attendance & Logistics

Attendees Table:

Modify Column: Replace hardcoded attendee_type with ticket_type_id (FK to event_ticket_types).

Remove Column: radio_frequency (Not required).

Event Planes Table:

Clarification: is_safety_checked remains a simple BOOLEAN.

4. Commerce & Merchandise

Variant Options Table:

Add Column: image_url (NVARCHAR(500), NULL). Allows specific images for "Red Shirt" vs "Blue Shirt".

5. Asset Hire

Asset Types Table:

Modify: Move from Global scope to Event scope.

Add Column: event_id (FK). Assets are managed as fleets per event.

6. Subevents & Camping

Campgrounds Table:

Modify FK: Change venue_id to event_id. Campgrounds are configured per event.

Campsites Table:

Add Column: price_per_night (DECIMAL(10,2)).

Logic: Users must select specific sites via Map UI.

7. Finance & Orders

Orders Table:

Add Column: tax_invoice_number (INT or NVARCHAR). Sequential, distinct from order_id.

Logic: user_id is MANDATORY. No guest checkout.

Payment Methods Table:

Add Columns:

is_available_at_gate (BIT).

is_available_online (BIT).

Logic: Enables "Cash" for gate only, "Stripe" for online only.