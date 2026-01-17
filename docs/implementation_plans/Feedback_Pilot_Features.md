# Pilot Features Implementation

## Context
We are implementing Multi-Plane selection, Heavy Model Cert renaming, High-Model Document Upload, and MOP (Manual of Procedures) Agreement capture.

## Database Schema Changes
> [!IMPORTANT]
> **Schema Changes**:
> The user has been provided the SQL to apply these changes.
> *   Table: `planes`
>     *   Column: `heavy_model_cert_image_url` (NVARCHAR(MAX))
> *   Table: `attendees`
>     *   Column: `has_agreed_to_mop` (BIT)

## Schema Mapping
We will map the User's requested fields as follows:

| User Field | Database Table | Database Column | Notes |
| :--- | :--- | :--- | :--- |
| **AUS Number** | `persons` | `license_number` | Already exists. |
| **Plane Make** | `planes` | `name` | Mapping "Make" to "name". |
| **Plane Model** | `planes` | `model_type` | Mapping "Model" to "model_type". |
| **Rego** | `planes` | `registration_number` | |
| **Heavy Cert #**| `planes` | `heavy_model_cert_number`| Already exists. |
| **Heavy Cert File**| `planes` | `heavy_model_cert_image_url` | **[NEW]** URL of uploaded PDF/Image. |
| **MOP Agreement**| `attendees` | `has_agreed_to_mop` | **[NEW]** Boolean flag. |

## Proposed Changes

### Frontend
#### [MODIFY] [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
*   **AUS Number**: Add input for `ausNumber`.
*   **MOP Agreement**:
    *   Add a section "Monitor of Procedures (MOP)".
    *   Display MOP Text (Placeholder text or loaded from Event).
    *   Add Checkbox: "I have read and agree to the MOP".
    *   **Validation**: Must be checked to proceed to registration.
*   **Plane List**:
    *   Replace single plane inputs with a list of planes.
    *   "Add Aircraft" button.
    *   **New Fields per Plane**:
        *   "Is this a heavy model?" (Checkbox/Toggle).
        *   If YES:
            *   Show "Heavy Model Cert #" Input (Required).
            *   Show "Heavy Model Permit" File Upload (Required).
            *   *Logic*: Upload file -> Get URL -> Store in state.
    *   **Validation**: Ensure Heavy Model fields are present if toggle is On.

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
*   **Display**: Show "AUS Number".
*   **Planes**: List planes with their Heavy Model status and link to Cert if present.

### API
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Persons**: Update `license_number`.
*   **Attendees**: Set `has_agreed_to_mop` = 1 (True).
*   **Planes**:
    *   Insert `heavy_model_cert_image_url` if provided.
    *   Insert `heavy_model_cert_number`.

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
*   Allow updating `has_agreed_to_mop` (though unlikely to change after reg?).
*   Allow adding/editing planes with new columns.

## Verification Plan
1.  **Registration Flow**:
    *   Enter Pilot Info.
    *   Try to proceed without MOP -> Fail.
    *   Check MOP -> Pass.
    *   Add Plane -> Toggle Heavy Model.
    *   Try to proceed without Upload -> Fail.
    *   Upload File -> Pass.
2.  **Database**:
    *   Verify `planes` has URL.
    *   Verify `attendees` has `has_agreed_to_mop` = 1.
3.  **Order Details**:
    *   Open Order. Click "View Heavy Model Cert" -> Opens URL.
