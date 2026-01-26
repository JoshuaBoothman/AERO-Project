# Pilot Declaration Wording Update - Walkthrough

I have successfully updated the terminology from "MOP" (Manual of Procedures) to "Pilot Declaration" in the Attendee Modal and Admin Event Form.

## Changes Verified

### 1. Attendee Modal (`AttendeeModal.jsx`)
- **Link Text**: Updated to "Read Pilot Declaration".
- **Checkbox Label**: Updated to "I have read and agree to the pilot declaration".
- **Validation Message**: Updated to "You must read and agree to the pilot declaration."

### 2. Admin Event Form (`EventForm.jsx`)
- **Section Heading**: Updated to "Pilot Declaration PDF".
- **View Button**: Updated to "View Pilot Declaration".
- **Upload Helper**: Updated to "Upload Pilot Declaration (Replaces current). Pilots must acknowledge this."

## Verification Results

### Automated Checks
N/A - These are static text changes.

### Manual Verification Required
- [ ] **Admin Event Form**: Check the "Pilot Declaration PDF" section in the event editor.
- [ ] **Attendee Registration**: Check the validation and display of the Pilot Declaration agreement in the attendee modal.
