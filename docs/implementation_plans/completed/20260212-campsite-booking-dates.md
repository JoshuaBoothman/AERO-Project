# Campsite Booking: Extended Dates + Camping Report Name Display

## Goal

Two changes:

1. **Extended Booking Dates**: Allow campsite arrival 1 day before event start and departure 1 day after event end (currently limited to exactly event dates).
2. **Camping Report Name Display**: Replace the "x" marker on booked nights in `/admin/reports/camping` with the booker's first + last name. The report's date grid must also include the extended dates.

---

## Current Behaviour

### Date Constraints (CampsiteModal)
The booking date pickers in [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx#L164-L186) use HTML `min`/`max` attributes set to `event.start_date` and `event.end_date`. This prevents users from selecting dates outside the event window.

### Camping Report Grid (CampingAvailabilityReport)
The grid in [CampingAvailabilityReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx#L154-L172) generates date columns from `event.start_date` to `event.end_date`. Booked cells display a lowercase "x" character ([line 287](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx#L285-L289)).

### Report Date Range (handleSearch)
The [handleSearch](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx#L43-L75) function passes `event.start_date` / `event.end_date` directly to the API, so bookings outside that exact range wouldn't appear even if they existed.

### Backend Booking Query (getCampgroundAvailability)
The [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js#L27-L35) API function fetches event dates and uses them as the boundary for its booking query. These boundaries need expanding.

### Backend Report Query (getAdminCampingReport)
The [getAdminCampingReport.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getAdminCampingReport.js) API already returns `first_name` and `last_name` from the `users` table via JOINs. No backend SQL changes needed for the name display — the data is already there.

### Order Creation (createOrder)
The [createOrder.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createOrder.js#L494-L619) campsite section does **not** enforce any date boundary server-side against the event dates. It only checks availability conflicts. No changes needed here.

---

## Logic Explanation

### Extended Dates Logic

The concept is simple: compute `event_start - 1 day` and `event_end + 1 day` as the allowed booking window.

- **Arrival (Check-in)**: Minimum selectable date = `event.start_date - 1 day`. Maximum remains `event.end_date` (can't arrive on the day after).
- **Departure (Check-out)**: Minimum remains `event.start_date` (can't depart before the event). Maximum selectable date = `event.end_date + 1 day`.
- This means a user can book the night *before* the event starts (arrive day before, depart event day 1) and/or the night *after* the event ends (arrive last event day, depart day after).

A helper function will compute `dayBefore(dateStr)` and `dayAfter(dateStr)` by parsing the `YYYY-MM-DD` string, adjusting by ±1 day, and returning a new `YYYY-MM-DD` string.

### Report Grid Logic

The date grid columns must also expand by 1 day on each side to include the extended booking range. The grid starts at `event_start - 1` and ends at `event_end + 1` (exclusive of the end, since columns represent *nights*). The API query date range for the report must also be expanded to `event_start - 1` → `event_end + 1` to capture bookings that fall on the extended dates.

### Name Display Logic

The report API already returns `first_name` and `last_name` for each booking row (joined through `order_items` → `orders` → `users`). The data is already stored in the `processedData` via `getBookingForDate()`. The cell rendering currently shows `<span>x</span>` — this will be replaced with the booker's name from the booking object. To keep cells compact, the name will be displayed as `First Last` in a small font with text wrapping/truncation.

---

## Database Changes

> [!NOTE]
> **No database changes are required.** All changes are frontend UI and API query boundaries only. The `campsite_bookings` table already stores arbitrary `check_in_date`/`check_out_date` values, and the report query already returns name data.

---

## Proposed Changes

### Frontend — CampsiteModal

#### [MODIFY] [CampsiteModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/CampsiteModal.jsx)

1. Add helper functions `dayBefore(dateStr)` and `dayAfter(dateStr)` that return `YYYY-MM-DD` strings shifted by ±1 day.
2. Update the Check-In `<input type="date">` `min` attribute from `formatDate(event?.start_date)` to `dayBefore(formatDate(event?.start_date))`.
3. Update the Check-Out `<input type="date">` `max` attribute from `formatDate(event?.end_date)` to `dayAfter(formatDate(event?.end_date))`.
4. Keep the default initial values as event start/end (only the *allowed range* expands, not the defaults).

```diff
 // Check In
-min={formatDate(event?.start_date)}
-max={formatDate(event?.end_date)}
+min={dayBefore(formatDate(event?.start_date))}
+max={formatDate(event?.end_date)}

 // Check Out
-min={formatDate(event?.start_date)}
-max={formatDate(event?.end_date)}
+min={formatDate(event?.start_date)}
+max={dayAfter(formatDate(event?.end_date))}
```

---

### Frontend — Camping Availability Report

#### [MODIFY] [CampingAvailabilityReport.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/CampingAvailabilityReport.jsx)

**Change 1 — Expand Grid Date Columns (lines 154–172)**

Update the `gridDates` memo to start 1 day before event start and end 1 day after event end:

```diff
-let curr = new Date(sStr);
-const end = new Date(eStr);
+// Extend grid by 1 day on each side
+let curr = new Date(sStr);
+curr.setDate(curr.getDate() - 1);  // Day before event
+const end = new Date(eStr);
+end.setDate(end.getDate() + 1);    // Day after event
```

**Change 2 — Expand API Query Date Range (lines 50–51)**

Update `handleSearch` to pass `event_start - 1 day` and `event_end + 1 day` to the API so bookings on the extended dates are returned:

```diff
-const startDate = event.start_date.split('T')[0];
-const endDate = event.end_date.split('T')[0];
+// Extend query range by 1 day each side
+const sDate = new Date(event.start_date.split('T')[0]);
+sDate.setDate(sDate.getDate() - 1);
+const startDate = sDate.toISOString().split('T')[0];
+const eDate = new Date(event.end_date.split('T')[0]);
+eDate.setDate(eDate.getDate() + 1);
+const endDate = eDate.toISOString().split('T')[0];
```

**Change 3 — Expand `processedData` Clamping (lines 85–89)**

Update the event start/end used for `totalEventNights` calculation and status determination to match the expanded range:

```diff
-const eventStart = new Date(sStr);
-const eventEnd = new Date(eStr);
+const eventStart = new Date(sStr);
+eventStart.setDate(eventStart.getDate() - 1);
+const eventEnd = new Date(eStr);
+eventEnd.setDate(eventEnd.getDate() + 1);
```

**Change 4 — Replace "x" With Booker Name (lines 285–289)**

Replace the `<span>x</span>` with the booker's first and last name:

```diff
 {booking ? (
-    <div style={{ width: '100%', height: '100%', minHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
-        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>x</span>
-    </div>
+    <div style={{ width: '100%', height: '100%', minHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
+        <span style={{ fontSize: '0.6rem', color: '#1e293b', lineHeight: '1.1', textAlign: 'center', wordBreak: 'break-word' }}>
+            {booking.first_name} {booking.last_name}
+        </span>
+    </div>
 ) : null}
```

Also increase `minWidth` on the date column headers from `40px` to `80px` to accommodate names.

---

### Backend — getCampgroundAvailability

#### [MODIFY] [getCampgroundAvailability.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getCampgroundAvailability.js)

Expand the event date boundaries by ±1 day so the booking grid and availability check cover the extended window:

```diff
-const eventStart = eventRes.recordset[0].start_date.toISOString().split('T')[0];
-const eventEnd = eventRes.recordset[0].end_date.toISOString().split('T')[0];
+// Extend by 1 day each side for early arrival / late departure
+const rawStart = new Date(eventRes.recordset[0].start_date);
+rawStart.setDate(rawStart.getDate() - 1);
+const eventStart = rawStart.toISOString().split('T')[0];
+const rawEnd = new Date(eventRes.recordset[0].end_date);
+rawEnd.setDate(rawEnd.getDate() + 1);
+const eventEnd = rawEnd.toISOString().split('T')[0];
```

---

### Interface Description

#### Booking Modal (CampsiteModal)
- **Check-In date picker**: Can now select 1 day before event start (e.g., if event starts July 10, earliest arrival = July 9).
- **Check-Out date picker**: Can now select 1 day after event end (e.g., if event ends July 17, latest departure = July 18).
- Default dates remain the event's own start/end dates.
- All other behaviour (full event toggle, pricing, site selection) remains unchanged.

#### Admin Camping Report (`/admin/reports/camping`)
- The grid now shows **2 extra columns** — one for the day before event start (the "early arrival" night) and one for the day after event end (the "late departure" night).
- Each booked cell now shows the **first and last name** of the person who booked the campsite, replacing the previous "x" marker.
- Column widths are increased to `80px` to accommodate names.
- The hover tooltip still shows full details (name + order number) as before.

---

## Verification Plan

### Manual Verification

> [!IMPORTANT]
> There are no automated tests in this project. All verification is manual.

1. **Booking Date Range**:
    - Navigate to the Store page and open the campsite booking modal.
    - Verify the Check-In date picker allows selecting 1 day before the event start date.
    - Verify the Check-Out date picker allows selecting 1 day after the event end date.
    - Verify the default dates are still the event start/end dates (not the extended range).
    - Book a campsite with an early-arrival date (day before event) and verify the booking is accepted.

2. **Camping Report — Extended Grid**:
    - Navigate to `/admin/reports/camping`.
    - Select an event and verify the date columns include 1 day before event start and 1 day after event end.
    - Verify that the early-arrival booking from step 1 appears on the correct date column.

3. **Camping Report — Name Display**:
    - On the same report, verify that booked cells show the booker's first and last name instead of "x".
    - Hover over a booked cell to confirm the tooltip still shows the full details.
