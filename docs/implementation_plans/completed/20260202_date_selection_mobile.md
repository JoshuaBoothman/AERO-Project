# Date Selection Limiting for Mobile

## Goal
To prevent users (specifically on mobile devices) from selecting arrival and departure dates outside of the official event dates during the ticket purchase loop. Current implementation relies solely on HTML5 `min`/`max` attributes which may be bypassed or unsupported on certain mobile browsers.

## Reasoning
The current `AttendeeModal.jsx` uses `<input type="date" min={...} max={...} />`. While standard compliant, some mobile browsers (especially older iOS/Android versions or specific overlays) rely on native pickers that might not strictly enforce these constraints, or the user interface allows scrolling past them. Crucially, there is **no JavaScript-level validation** in the `handleSubmit` function to catch these invalid dates before processing.

By adding server-side strict validation (simulated in client-side JS before submission), we ensure that even if the UI allows it, the user cannot proceed with invalid dates.

## Proposed Changes

### Client-Side Validation (`client/src/components/AttendeeModal.jsx`)

1.  **Modify `handleSubmit` function**:
    *   Retrieve `event.eventStartDate` and `event.eventEndDate`.
    *   Parse these dates (stripping time components to avoid timezone issues).
    *   For each attendee:
        *   Parse `arrivalDate` and `departureDate`.
        *   **Validation Check 1**: Ensure `arrivalDate` >= `eventStartDate`.
        *   **Validation Check 2**: Ensure `departureDate` <= `eventEndDate`.
        *   **Validation Check 3**: Ensure `arrivalDate` <= `departureDate`.
    *   If any check fails, display a strict error notification using `notify()` and block submission.

2.  **Logic Detail**:
    *   Dates should be compared as clean `YYYY-MM-DD` strings or localized Date objects set to midnight to avoid "off-by-one-day" timezone bugs (referencing `SKILL.md` date handling protocol).
    *   Example:
        ```javascript
        const activeStartDate = event?.eventStartDate ? event.eventStartDate.split('T')[0] : null;
        const activeEndDate = event?.eventEndDate ? event.eventEndDate.split('T')[0] : null;

        if (activeStartDate && data.arrivalDate < activeStartDate) {
           notify(`Arrival date must be on or after ${formatDateForDisplay(activeStartDate)}`);
           return;
        }
        ```

### Database Updates (Manual)

The user indicated database changes are manual. A SQL script will be provided to ensure the event actually has `start_date` and `end_date` populated, as these are required for the logic to work.

## Verification Plan

### Automated Tests
*   **None available for UI interaction**: Since this is a React UI modal interaction, unit tests for the component would require mounting the modal.
*   **Manual Verification**:
    1.  Navigate to Store -> Select Ticket -> Add to Cart.
    2.  In "Attendee Details" modal:
        *   Try to manually type (if possible) or select a date BEFORE the event start.
        *   Try to select a date AFTER the event end.
        *   Click "Confirm".
        *   **Expectation**: Validation error "Arrival Date cannot be before..." or similar.
    3.  Select valid dates.
        *   Click "Confirm".
        *   **Expectation**: Success, added to cart.

## SQL Script (For User Execution)

Run this in SSMS to ensure your event has valid dates (replace 'your-slug' and dates as needed).

```sql
-- Check existing dates
SELECT event_id, name, slug, start_date, end_date 
FROM events 
WHERE slug = 'ALSM2026'; -- Replace with your actual slug

-- Update dates if NULL (Example dates, please adjust!)
-- UPDATE events
-- SET start_date = '2026-04-14 00:00:00', 
--     end_date = '2026-04-20 23:59:59'
-- WHERE slug = 'ALSM2026';
```
