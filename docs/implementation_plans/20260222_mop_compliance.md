# MOP (Manual of Procedures) Compliance

## Goal Description
Ensure every pilot acknowledges the event-specific MOP PDF during registration.
Admins need to be able to upload this PDF for each event.
Users need to be able to click a link to read it before checking the "Agree" box.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Add `mop_url` (nvarchar, nullable) to `events` table to store the PDF link.

## Proposed Changes

### Database
-   **Table**: `events`
-   **Column**: Add `mop_url` (nvarchar, nullable).

### Backend (API)
#### [MODIFY] [updateEvent.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateEvent.js)
- Handle saving `mop_url`.

#### [MODIFY] [getEventDetail.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventDetail.js)
- Return `mop_url` so the frontend can link to it.

### Frontend (Admin)
#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/admin/EventForm.jsx)
- Add a File Upload / URL input field for "MOP PDF" under Event Settings.

### Frontend (User)
#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/public/AttendeeModal.jsx)
- Locate the "I agree to MOP" checkbox.
- Add a clickable link: "Read MOP" that opens the `mop_url` in a new tab.

## Verification Plan
### Manual Verification
1.  **Admin**: Upload PDF/URL for MOP in Event Settings.
2.  **User**: Go to Registration. Click "Read MOP". Verify PDF opens.
