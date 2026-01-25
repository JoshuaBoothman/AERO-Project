# My Planes Modifications

## Goal Description
The goal is to enhance the "My Planes" functionality to be the central hub for users to manage their aircraft fleet. Currently, the menu item is hidden unless the user already owns planes. We will expose this menu to all registered users. Additionally, we will enable logged in users to register new planes from this screen, ensuring that every aircraft is correctly linked to a registered pilot profile associated with the user.

## User Review Required
> [!IMPORTANT]
> **Prerequisite Rule**: A user CANNOT register a new plane unless they have at least one valid "Pilot" registered under their account. The interface will strictly enforce this.

## Proposed Changes

### Client
#### [MODIFY] [Layout.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Layout.jsx)
- **Change**: Remove the `hasPlanes` conditional check. The "My Planes" link must be visible to all authenticated users.

#### [MODIFY] [MyPlanes.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/MyPlanes.jsx)
- **New Workflow: "Add Plane"**:
    1.  **Event Check**: On load/click, fetch "Events where User is a Pilot" (`/api/user/pilot-events`).
    2.  **Step 1: Event Selection**:
        -   If user has NO pilot-qualifying events: Show a helpful error: "You need to be registered as a Pilot for an event to add a plane."
        -   If user has qualifying events: Show a dropdown/modal to select the Event.
    3.  **Step 2: Pilot Selection**:
        -   Once Event is selected, fetch compatible Pilots using `getUserEventAttendees(event_slug)`.
        -   User selects the specific "Person" (Pilot) record.
    4.  **Step 3: Plane Details**:
        -   Standard Plane form (Make, Model, Rego, Heavy Model details).
        -   Include `person_id` in the payload.

### Backend
#### [NEW] [getPilotEvents.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getPilotEvents.js)
-   **Endpoint**: `GET /api/user/pilot-events`
-   **Logic**:
    -   Query events linked to the current user via `attendees` -> `event_ticket_types`.
    -   Filter WHERE `system_role` = 'pilot'.
    -   Return list of events (id, name, slug) to populate the dropdown.

#### [NEW] [createPlane.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createPlane.js)
-   **Endpoint**: `POST /api/planes`
-   **Payload**: `{ person_id, name, model_type, registration_number, is_heavy_model, ... }`
-   **Validation**: Ensure `person_id` belongs to the authenticated user.
-   **Action**: Insert into `planes`.

## Verification Plan

### Manual Verification
1.  **Menu Visibility**:
    - Login as a user with 0 planes.
    - Verify "My Planes" appears in the menu.
2.  **No Pilots Scenario**:
    - Login as a user with 0 pilots.
    - Go to "My Planes".
    - Click "Add Plane" (or verify button state).
    - Expect Warning/Error message explaining dependency.
3.  **Happy Path**:
    - Login as a user with 1+ Pilot and 0 Planes.
    - Click "Add Plane".
    - Select Pilot from dropdown.
    - Fill details (Heavy Model).
    - Save.
    - Verify Plane appears in list.
    - Verify Plane is Heavy Model compliant (tags shown).
