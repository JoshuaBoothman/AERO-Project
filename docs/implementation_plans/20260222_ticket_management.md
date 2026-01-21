# Ticket Type Sorting

## Goal Description
Implement drag-and-drop reordering for Ticket Types in the Admin Event setup. This sort order must be reflected in the public-facing store so tickets appear in the desired sequence.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Adding `sort_order` column (int) to `event_ticket_types`.

## Proposed Changes

### Database
#### [MODIFY] [check_schema_v2.js](file:///c:/laragon/www/AERO-Project/check_schema_v2.js)
- Add `sort_order` (int) to `event_ticket_types` table.

### Backend (API)
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
- Update `GET` to `ORDER BY sort_order ASC`.
- Update `POST` (Create) to assign a default sort order (e.g. max + 1).

#### [NEW] [reorderTicketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/reorderTicketTypes.js)
- Create endpoint `PUT /api/events/{id}/ticket-types/reorder`.
- Accepts an array of `{ ticket_type_id, sort_order }`.
- Updates database transactionally.

### Frontend (Client)
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- **Ticket List**: Implement `<DndContext>` and `<SortableContext>` (using `@dnd-kit`) for the ticket table rows.
- **Action**: On drag end, trigger API call to `reorderTicketTypes`.

## Verification Plan
### Manual Verification
1.  **Admin Sorting**: Drag "General Admission" above "VIP". Refresh page. Verify order persists.
2.  **Public Store**: Go to Event Details page. Open "Get Tickets". Verify "General Admission" is above "VIP".
