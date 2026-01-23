# Heavy Model Permits & MOP Management

## Goal Description
Enhance the management of Heavy Model compliance. This serves two distinct purposes:
1.  **MOP (Manual of Procedures) Compliance**: Ensure every pilot acknowledges the event-specific MOP PDF during registration.
2.  **Heavy Model Certificate Management**: Provide Admins visibility of all Heavy Model planes attending the event, and allow Users to manage/update their own plane certificates.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Add `mop_url` (or `terms_and_conditions_url`) to `events` table to store the PDF link.

## Proposed Changes

### 1. MOP Compliance (Event Level)

#### Database
-   **Table**: `events`
-   **Column**: Add `mop_url` (nvarchar, nullable).

#### Backend (API)
-   **`updateEvent.js`**: Handle saving `mop_url`.
-   **`getEventDetail.js`**: Return `mop_url` so the frontend can link to it.

#### Frontend (Admin)
-   **`EventForm.jsx`**: Add a File Upload / URL input field for "MOP PDF" under Event Settings.

#### Frontend (User)
-   **`AttendeeModal.jsx`**:
    -   Locate the "I agree to MOP" checkbox.
    -   Add a clickable link: "Read MOP" that opens the `mop_url` in a new tab.

---

### 2. Heavy Model Certificates (User Management)

#### Frontend (User)
-   **`Layout.jsx`**: Add "My Planes" navigation link (Show ONLY if user has >= 1 registered plane).
-   **`MyPlanes.jsx` (New Page)**:
    -   List all planes owned by the user.
    -   Allow editing details (Wingspan, Weight, Heavy Model Status).
    -   **KEY FEATURE**: Allow re-uploading the "Heavy Model Certificate" image/PDF for existing planes.
    -   Allow deleting planes (if not linked to an active order? or soft delete).

#### Backend (API)
-   **`getPlanes.js`**: Ensure it filters by `user_id` securely.
-   **`updatePlane.js`**: Allow users to update their own plane details/images.
-   **`deletePlane.js`**: Implement safe deletion logic.

---

### 3. Heavy Model Reports (Admin)

#### Frontend (Admin)
-   **`EventPlanesReport.jsx` (New Report)**:
    -   Table listing all planes attached to Attendees for the current event.
    -   Columns: Pilot Name, Plane Name, Model, Weight, **Heavy Model (Yes/No)**, **Certificate Button**.
    -   Filter: "Show Only Heavy Models".
-   **`AdminDashboard.jsx`**:
    -   Add "Event Planes" link under the "Attendees" card.

#### Backend (API)
-   **`getEventPlanes.js`**:
    -   Fetch all valid attendees -> link to planes.
    -   Return `heavy_model_cert_image_url` for display.

## Verification Plan
### Manual Verification
1.  **MOP Link**: Admin -> Upload PDF. User -> Register -> Click "Read MOP". Verify PDF opens.
2.  **My Planes**: User -> Go to "My Planes". User -> Edit a plane. User -> Replace Certificate. Backend -> Verify new image URL is saved.
3.  **Admin Report**: Admin -> Click "Event Planes". toggle "Heavy Models Only". View a certificate.
