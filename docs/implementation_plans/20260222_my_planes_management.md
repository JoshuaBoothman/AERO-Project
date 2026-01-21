# My Planes (User Management)

## Goal Description
Allow Users to view and manage their own planes, specifically to facilitate keeping Heavy Model Certificates up to date.

## User Review Required
None.

## Proposed Changes

### Frontend (User)
#### [MODIFY] [Layout.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Layout.jsx)
- Add "My Planes" navigation link (Show ONLY if user has >= 1 registered plane).

#### [NEW] [MyPlanes.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/MyPlanes.jsx)
- List all planes owned by the user.
- Allow editing details (Wingspan, Weight, Heavy Model Status).
- **KEY FEATURE**: Allow re-uploading the "Heavy Model Certificate" image/PDF for existing planes.
- Allow deleting planes (if not linked to an active order? or soft delete).

### Backend (API)
#### [MODIFY] [getPlanes.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getPlanes.js)
- Ensure we can fetch planes by User ID securely.

#### [NEW] [updatePlane.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updatePlane.js)
- Allow users to update their own plane details and `heavy_model_cert_image_url`.

#### [NEW] [deletePlane.js](file:///c:/laragon/www/AERO-Project/api/src/functions/deletePlane.js)
- Implement safe deletion logic (check for dependencies).

## Verification Plan
### Manual Verification
1.  **Navigation**: Verify "My Planes" link appears only for pilot users.
2.  **Edit**: Change plane weight and upload new certificate. Verify persistence.
3.  **Delete**: Delete a plane. Verify it disappears from list.
