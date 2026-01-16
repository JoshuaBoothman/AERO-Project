# Pilot Features Implementation (Existing Schema)

## Context
We are implementing Multi-Plane selection, Heavy Model Cert renaming, and AUS Number capture using the **existing database schema**.

## Existing Schema Mapping
We will map the User's requested fields to the existing columns in `planes` and `persons`:

| User Field | Database Table | Database Column | Notes |
| :--- | :--- | :--- | :--- |
| **AUS Number** | `persons` | `license_number` | Already exists. |
| **Plane Make** | `planes` | `name` | Mapping "Make" to "name". |
| **Plane Model** | `planes` | `model_type` | Mapping "Model" to "model_type". |
| **Rego** | `planes` | `registration_number` | |
| **Heavy Cert #**| `planes` | `heavy_model_cert_number`| Already exists. |

> [!NOTE]
> No database schema changes are required from the User.

## Proposed Changes

### Frontend
#### [MODIFY] [EventDetails.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/EventDetails.jsx)
*   **AUS Number**: Add input for `ausNumber` in the Attendee form (updates `license_number`).
*   **Plane List**:
    *   Replace single plane inputs with a list of planes.
    *   "Add Aircraft" button.
    *   Inputs: Make (`name`), Model (`model_type`), Rego (`registration_number`), Heavy Model Cert (`heavy_model_cert_number`).
    *   **Validation**: If "Heavy Model Cert" is filled, ensure it's valid? (MVP: Text input).
    *   **Label Change**: Rename "CASA License / ARN" to "Heavy Model Cert #".

#### [MODIFY] [OrderDetail.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/OrderDetail.jsx)
*   **Display**: Show "AUS Number" (License Number).
*   **Planes**: List all planes linked to the attendee (via Person).
*   **Edit**: Allow adding/editing planes in the modal.

### API
#### [MODIFY] [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js)
*   **Persons**: Update `license_number` if provided.
*   **Planes**:
    *   Loop through provided planes.
    *   Insert into `planes` (fields: `person_id`, `name`, `model_type`, `registration_number`, `heavy_model_cert_number`).
    *   Insert into `event_planes` (fields: `event_id`, `plane_id` - ensure `is_safety_checked` defaults to 0).

#### [MODIFY] [updateAttendee.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateAttendee.js)
*   Allow updating `license_number`.
*   Allow adding/editing planes.
    *   If `plane_id` provided: Update existing record.
    *   If no `plane_id`: Insert new record and link to event.

## Verification Plan
1.  **Registration**: Register a pilot with AUS Number "12345" and 2 planes ("Extra 300", "Piper Cub").
2.  **Verify DB**:
    *   `SELECT * FROM persons WHERE license_number = '12345'`
    *   `SELECT * FROM planes WHERE name = 'Extra'`
    *   `SELECT * FROM event_planes`
3.  **UI**: Check Order Details page displays the info correctly.
