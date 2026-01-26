# Pilot Declaration Wording Update

This plan outlines the changes required to update "MOP" references to "Pilot Declaration" in the Attendee Modal and Admin Event Form to improve clarity for pilots and administrators.

## User Review Required

> [!NOTE]
> The error message in `AttendeeModal.jsx` when the user hasn't checked the box ("You must read and agree to the Monitor of Procedures (MOP).") will also be updated to "You must read and agree to the pilot declaration." to be consistent with the UI changes.

## Proposed Changes

### Client

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
- Update link text from "Read MOP" to "Read Pilot Declaration".
- Update checkbox label from "I have read and agree to the MOP" to "I have read and agree to the pilot declaration".
- Update validation error message to match new terminology.

#### [MODIFY] [EventForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/EventForm.jsx)
- Update section heading from "MOP PDF (Manual of Procedures)" to "Pilot Declaration PDF".
- Update "View MOP" button text to "View Pilot Declaration".
- Update helper text/label from "Upload MOP PDF ..." to "Upload Pilot Declaration (Replaces current). Pilots must acknowledge this.".

## Verification Plan

### Manual Verification
- **Admin Event Form**:
  - Go to an event edit page.
  - Verify the section title is "Pilot Declaration PDF".
  - Verify the view button says "View Pilot Declaration".
  - Verify the upload help text says "Upload Pilot Declaration".
- **Attendee Modal**:
  - Go to the event registration page.
  - Add a pilot ticket.
  - Verify the link says "Read Pilot Declaration".
  - Verify the checkbox says "I have read and agree to the pilot declaration".
  - Attempt to submit without checking the box and verify the error message.
