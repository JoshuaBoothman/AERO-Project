# My Planes Modifications

## Goal Description
The goal is to enhance the "My Planes" functionality to be the central hub for users to manage their aircraft fleet. Currently, the menu item is hidden unless the user already owns planes. We will expose this menu to all registered users. Additionally, we will enable users to register new planes from this screen, ensuring that every aircraft is correctly linked to a registered pilot profile associated with the user.

## User Review Required
> [!IMPORTANT]
> **Prerequisite Rule**: A user CANNOT register a new plane unless they have at least one valid "Pilot" registered under their account. The interface will strictly enforce this. Provide feedback if this restriction should be lifted or handled differently (e.g., creating a placeholder pilot).

## Proposed Changes

### Client
#### [MODIFY] [Layout.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Layout.jsx)
- **Problem**: The "My Planes" menu link is conditional on `hasPlanes` state.
- **Change**: Remove the `hasPlanes` conditional check for the navigation link. The link should be visible to all authenticated users.

#### [MODIFY] [MyPlanes.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/MyPlanes.jsx)
- **New Data Requirement**: Fetch the user's "Pilots".
    - We need to query the user's linked people/attendees who handle the role of 'Pilot'.
    - *Endpoint Idea*: Reuse or adapt user attendees endpoint to filter for pilots.
- **Interface Update**:
    - **Header**: Maintain "My Hangar".
    - **Empty State**: If no planes exist, show the "No planes registered" empty state but include a clear call-to-action (CTA) button: "Register New Plane".
    - **Add Logic**:
        - When "Register New Plane" is clicked, check if the user has any registered Pilots.
        - **Case A (No Pilots)**: Show an alert/modal warning: "You must register a Pilot first. Please go to an Event and register a Pilot." Disable the ability to proceed with plane addition.
        - **Case B (Has Pilots)**: Open the Add/Edit Plane Modal.
- **Modal Update** (Inspiration: `AttendeeModal.jsx`):
    - Add a **"Pilot" Selection Dropdown** as the first field.
        - Options: List of user's registered pilots (Names).
        - Required: Yes.
    - **Plane Fields** (Standardize with `AttendeeModal`):
        - Make (Text)
        - Model (Text)
        - Registration Number (Text, Required)
        - Heavy Model (Checkbox)
        - *If Heavy Model*:
            - Weight (kg) (Number, Required)
            - Heavy Model Cert # (Text, Required)
            - Certificate File (Upload, Required)
- **Payload Construction**:
    - When saving, include the selected `person_id` (from the Pilot selection) in the POST/PUT request to link the plane to that specific person.

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
