# Official Dinner Registration Implementation Plan

## Goal Description
Allow users to register for the "Official Dinner" subevent when purchasing specific ticket types. This involves:
1.  **Admin Configuration**: Link an Event to an "Official Dinner" Subevent, and configure specific Ticket Types to offer this dinner as an option.
2.  **User Experience**: When purchasing a ticket that offers the dinner, users can opt-in. If opted-in, the subevent is added to their cart at zero cost.

## User Review Required
> [!IMPORTANT]
> **Database Changes**: This plan requires schema changes to `events` and `event_ticket_types` tables. A SQL script `20260127_official_dinner_registrations.sql` will be provided.

> [!NOTE]
> **Separation of Concerns**: This plan adds the "opt-in" checkbox at ticket purchase time (in `EventPurchase.jsx`). The `AttendeeModal.jsx` already has a separate "attending official dinner" confirmation field that will be refined by the [Event Tickets Attendee Details](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_event_tickets_attendee_details.md) plan. These are two different mechanisms:
> - **This plan**: Offers the option to add the subevent to cart during ticket purchase
> - **Event Tickets plan**: Collects dietary requirements and confirms attendance in attendee details

- The "Official Dinner" is treated as a **Subevent**. Ensure a Subevent is created for the dinner before configuring the event.
- The system adds the subevent to the cart. This assumes the checkout flow handles Subevent items correctly (which it should, as users can purchase subevents separately).

## Proposed Changes

### Database
#### [MODIFY] Database Schema
- **`events` table**: Add `official_dinner_subevent_id` (INT, Nullable, Foreign Key to `subevents`).
- **`event_ticket_types` table**: Add `includes_official_dinner` (BIT, Default 0).

### API
#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
- Update query to fetch `official_dinner_subevent_id` from `events`.
- Update query to fetch `includes_official_dinner` from `event_ticket_types`.

#### [MODIFY] Save/Update Functions
- Update `createEvent`, `updateEvent`, `createTicketType`, `updateTicketType` logic to handle the new fields.

### Client
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- **Event Settings**: Add a dropdown "Official Dinner Subevent" (fetched from event's subevents).
- **Ticket Modal**: Add "Includes Official Dinner Entry" checkbox.

#### [MODIFY] [EventPurchase.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventPurchase.jsx)
- **Logic**:
    - Fetch Event Details to get `official_dinner_subevent_id`.
    - If a selected Ticket Type has `includes_official_dinner` = true, show a checkbox "Add Official Dinner Entry?" (per ticket type block).
    - If checked, fetch the Subevent details (if not already loaded) and prepare to add it to the cart.
- **Cart Construction**:
    - In `handleNext`, if "Add Official Dinner" is checked for a ticket type, add a corresponding line item for the Official Dinner Subevent:
        - `quantity`: Same as Ticket Quantity.
        - `price`: 0.
        - `type`: 'subevent' (or system specific type).

## Verification Plan

### Automated Tests
- None planned for this UI/Config feature.

### Manual Verification
1.  **Database**: Run the SQL script `20260127_official_dinner_registrations.sql`.
2.  **Admin**:
    - Go to Admin > Edit Event.
    - Create a Subevent "Gala Dinner".
    - In Event Settings, select "Gala Dinner" as the Official Dinner Subevent.
    - Edit a Ticket Type (e.g., "Adult"), check "Includes Official Dinner Entry".
    - Save.
3.  **User**:
    - Go to Event Ticket Purchase page.
    - Select 2x "Adult" tickets.
    - Verify "Add Official Dinner Entry?" checkbox appears.
    - Check the box.
    - Click Next.
    - **Verify Cart**: Ensure cart contains 2x "Adult" tickets AND 2x "Gala Dinner" subevents at $0.00.

## SQL

-- 1. Add official_dinner_subevent_id to events table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'events') 
    AND name = 'official_dinner_subevent_id'
)
BEGIN
    ALTER TABLE events
    ADD official_dinner_subevent_id INT NULL;

    PRINT 'Added official_dinner_subevent_id to events table.';
END
ELSE
BEGIN
    PRINT 'official_dinner_subevent_id already exists in events table.';
END
GO

-- 2. Add includes_official_dinner to event_ticket_types table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'event_ticket_types') 
    AND name = 'includes_official_dinner'
)
BEGIN
    ALTER TABLE event_ticket_types
    ADD includes_official_dinner BIT DEFAULT 0;

    PRINT 'Added includes_official_dinner to event_ticket_types table.';
END
ELSE
BEGIN
    PRINT 'includes_official_dinner already exists in event_ticket_types table.';
END
GO

-- 3. Add Foreign Key Constraint (Optional but recommended)
-- We check if the constraint exists first
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_Events_OfficialDinnerSubevent'))
BEGIN
    -- Note: Ensure subevents table exists and subevent_id is PK. 
    -- If subevents logic is complex, might skip strict FK if soft link preferred, but usually good practice.
    ALTER TABLE events
    ADD CONSTRAINT FK_Events_OfficialDinnerSubevent
    FOREIGN KEY (official_dinner_subevent_id) REFERENCES subevents(subevent_id);

    PRINT 'Added FK_Events_OfficialDinnerSubevent constraint.';
END
GO
