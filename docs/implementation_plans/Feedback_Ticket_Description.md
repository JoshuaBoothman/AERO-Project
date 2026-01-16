# Ticket Type Description Field

## User Review Required
> [!NOTE]
> This change introduces a schema change to `event_ticket_types`.

## Proposed Changes

### Database
#### [MANUAL ACTION REQUIRED]
> [!IMPORTANT]
> **User Action Required:** Run the following SQL command on **BOTH** the `sqldb-aero-dev` (Development) and `sqldb-aero-master` (Live) databases.
> Verify the column is added before proceeding.

```sql
ALTER TABLE event_ticket_types ADD description NVARCHAR(MAX) NULL;
```

### API
#### [MODIFY] [ticketTypes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/ticketTypes.js)
*   Update `createTicketType` to accept and insert `description`.
*   Update `updateTicketType` to accept and update `description`.
*   Update `getTicketTypes` to select `description` (already uses `SELECT *`).

#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
*   Update line 62 to include `description`.

### Frontend
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
*   Update `ticketForm` state to include `description`.
*   Add `<textarea>` input for Description in the Ticket Modal.
*   Update `handleSaveTicket` logic.

#### [MODIFY] [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
*   Display `t.description` inside the ticket list loop.

## Verification Plan

### Manual Verification
1.  **DB**: Run `ALTER TABLE event_ticket_types ADD description NVARCHAR(MAX);`
2.  **Admin**: Go to Event Edit -> Ticket Types -> Add Ticket. Verify "Description" field exists. Add a description. Save.
3.  **API**: Check network request payload.
4.  **Public**: Go to Event Details -> Get Tickets. Verify Description is visible under the Ticket Name.
