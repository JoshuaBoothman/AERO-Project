# Deep Dive: Pilot & Plane Logic

This document details the complex logic required for Pilot and Aircraft management, separating it from the core module requirements.

## 1. Registration Flow Enhancements
**Scenario:** "I am registering a Pilot (Myself or another person I manage)."

### 1.1 Pilot Lookup (The "Person" Layer)
*   **User Action:** Selects "Myself" OR "Existing Pilot" (from `persons` linked to their User ID).
    *   *Note:* A single User Account (e.g., Dad) might manage multiple Pilots (Self + Son).
*   **System Action:**
    *   Pre-fills Name, ARN, License info from the selected `persons` record.
    *   If "New Pilot", requires full entry and creates a new `persons` record linked to the User.

### 1.2 Plane Selection (The "Hangar")
Real-world pilots often bring multiple planes or fly different planes at different events. They should not re-enter data every time.

*   **UI:** "Select Aircraft" section appears after Pilot selection.
*   **Option A: "My Hangar"**
    *   Lists planes already in the `planes` table linked to this Person.
    *   *UI:* Checkbox selection (e.g., `[x] Extra 300 (VH-X30)`, `[ ] Cessna 172 (VH-C17)`).
*   **Option B: "New Aircraft"**
    *   *UI:* "Add another plane" button.
    *   *Inputs:* Make, Model, Rego.
    *   *Action:* Creates a new `planes` record linked to the Person immediately (or upon Order creation).

### 1.3 Persistence (The "Event Link")
*   **Database:** We do not duplicates planes per event.
*   **`event_planes` Table (Proposed):**
    *   Many-to-Many link acting as the "Attendance Record" for the aircraft.
    *   Columns: `event_plane_id`, `event_id`, `plane_id`, `pilot_attendee_id`.
*   **Validation:** Check `event_ticket_types` for any limits on number of planes (likely "Unlimited" for most pilot tickets).

---

## 2. Flight Line Duties
Volunteering for duties is critical for event operations.

### 2.1 Registration & Availability
*   **Trigger:** During Pilot Registration.
*   **Input:** Checkbox `[x] Available for Flight Line Duties`.
*   **Storage:** Stored on the `attendees` record (new column `is_volunteer` or similar).

### 2.2 Ops Dashboard (Admin)
*   **Interface:** A "Roster" view of 1-hour slots for the event duration.
*   **Action:** Admin drags-and-drops available pilots into slots.
*   **Validation:**
    *   **Time Conflict:** Ensure the pilot is not registered for a Subevent (Dinner/Workshop) during that slot.
