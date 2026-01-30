# User Interface Cleanup Jobs

## Goal
Execute a series of quick "cleanup" jobs requested by the user to improve usability on the Login screen and Attendee Modal.

## Proposed Changes
### Client
#### [MODIFY] [Login.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Login.jsx)
-   **Register Link Visibility**:
    -   Move "Create an Account" section to the **top** of the login container.
    -   Style the button with the **Accent Color (Gold)** and Black text.
    -   Ensure visual separation from the login form.

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
-   **Text Updates**:
    -   Official Dinner: Append "(free with this ticket)" to label.
    -   Included Merchandise: Append "(free with this ticket)" to header.
    -   Heavy Models: Change "Are you bringing heavy models" to "I am bringing Heavy Models".
-   **Visibility Logic**:
    -   **Dietary Requirements**: Hide entirely when "Attending Dinner" is unchecked.
-   **Validation Logic**:
    -   **Heavy Model Inspector**: Fix bug where exempt inspectors were blocked by certificate validation. Logic: `if (bringingHeavyModels && !isHeavyModelInspector)`.

## Verification Plan
### Manual Verification
-   **Login Screen**:
    -   Start app, go to `/login`.
    -   Verify "Create an Account" is at the top and gold.
-   **Attendee Modal**:
    -   Create/Select a ticket.
    -   Uncheck Dinner -> Dietary box must disappear.
    -   Check Dinner -> Box reappears.
    -   Select "I am bringing Heavy Models" + "Inspector: Yes".
    -   Click Confirm -> Should pass validation without asking for certs.
