# Limit Date Selection to Event Dates

## Goal Description
The goal is to restrict user date selection in various calendars (date pickers) throughout the application to ensuring users can only select dates within the valid event range. 
Dates outside the event start and end dates boundaries should be visually indicated (greyed out) and unselectable.
Additionally, the calendar interface should automatically open to the month of the event's start date to improve user experience.

## User Review Required
> [!IMPORTANT]
> **Scope Confirmation Needed**
> Please review the "Identified Date Selection Locations" list below and confirm which ones should be restricted to the event dates.

### Identified Date Selection Locations (Report)
The following components/pages were found to contain date selection logic:

1.  **Campsite Booking (`CampsiteModal.jsx`)**
    *   **Fields**: Check In, Check Out.
    *   **Current State**: Defaults to event dates but allows any date selection.
    *   **Proposed**: Limit to `event.start_date` and `event.end_date`.

2.  **Asset Hiring (`AssetSelectionModal.jsx`)**
    *   **Fields**: Hire Start, Hire End (in "Daily Hire" mode).
    *   **Current State**: Allows any date selection.
    *   **Proposed**: Limit to `event.start_date` and `event.end_date`.

3.  **Attendee Registration (`AttendeeModal.jsx`)**
    *   **Fields**: Arrival Date, Departure Date.
    *   **Current State**: Defaults to event dates but allows any date selection.
    *   **Proposed**: Limit to `event.start_date` and `event.end_date`.

4.  **Date of Birth (`AttendeeModal.jsx`)**
    *   **Fields**: Date of Birth.
    *   **Recommendation**: **Exclude** from this change (DOB is obviously in the past).

5.  **Admin Event Form (`EventForm.jsx`)**
    *   **Fields**: Event Start/End Dates, Early Bird Dates, etc.
    *   **Recommendation**: **Exclude** (Admins define the dates here).

## Proposed Changes

### Logic Explanation
To implement this, I will use the standard HTML5 `input` attributes `min` and `max` for `type="date"` elements.
*   **Limiting Range**: Setting `min={eventStartDate}` and `max={eventEndDate}` will natively grey out and disable selection of dates outside this range in modern browsers.
*   **Default Month**: By ensuring the `value` of the input is initialized to a date within the event range (e.g., the Event Start Date), the browser's date picker will automatically open to that month.

### Interface Description
*   **Visuals**: Dates outside the allowed range will appear greyed out and will not be clickable.
*   **Interaction**:
    *   When the user opens the date picker, it will be focused on the Event Start Date month (if the current value is set to start date) or the currently selected valid date.
    *   Users cannot navigate to or select invalid dates.
    *   Validation messages (native or custom) will appear if a user manually types an invalid date.

### Components to Modify

#### [Modify] [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx)
*   Update `Check In` and `Check Out` inputs:
    *   Add `min={formatDate(event?.start_date)}`
    *   Add `max={formatDate(event?.end_date)}`
*   Ensure state initialization uses these bounds.

#### [Modify] [AssetSelectionModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AssetSelectionModal.jsx)
*   Update `hireDates.start` and `hireDates.end` inputs:
    *   Add `min` and `max` using `eventDates` prop.

#### [Modify] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
*   Update `Arrival Date` and `Departure Date` inputs:
    *   Add `min` and `max` using `event` prop (need to ensure `event` prop is passed correctly and has dates).

## Verification Plan

### Manual Verification
1.  **Campsite Booking**:
    *   Open an event (e.g., "Air Show 2026").
    *   Open "Book Campsite".
    *   Click "Check In" date picker.
    *   Verify dates before Event Start are greyed out.
    *   Verify dates after Event End are greyed out.
    *   Verify the picker opens to the correct month.
2.  **Asset Hiring**:
    *   Go to Store, view a customizable asset (e.g., "Golf Buggy").
    *   Select "Daily Hire".
    *   Click date inputs.
    *   Verify restriction to event dates.
3.  **Attendee Model**:
    *   Proceed to checkout/attendee details.
    *   Check "Arrival Date" and "Departure Date".
    *   Verify restriction to event dates.
