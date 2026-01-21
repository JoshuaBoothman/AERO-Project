# Heavy Model Reports (Admin)

## Goal Description
Provide Admins visibility of all Planes attending the event, highlighting Heavy Models and providing access to their certificates.

## User Review Required
None.

## Proposed Changes

### Frontend (Admin)
#### [NEW] [EventPlanesReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/admin/reports/EventPlanesReport.jsx)
- Table listing all planes attached to Attendees for the current event.
- Columns: Pilot Name, Plane Name, Model, Weight, **Heavy Model (Yes/No)**, **Certificate Button**.
- Filter: "Show Only Heavy Models".

#### [MODIFY] [AdminDashboard.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminDashboard.jsx)
- Add "Event Planes" link under the "Attendees" card.

### Backend (API)
#### [NEW] [getEventPlanes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getEventPlanes.js)
- Fetch all valid attendees -> link to planes.
- Return plane details including `heavy_model_cert_image_url` and pilot name.

## Verification Plan
### Manual Verification
1.  **Access**: Click "Event Planes" on Admin Dashboard.
2.  **Filter**: Toggle "Heavy Models Only".
3.  **View**: Click "View Certificate" on a heavy model. Verify image/pdf opens.
