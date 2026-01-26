# Flight Line Duties Implementation Plan

## Goal Description
Implement a system to manage flight line duties for events. This involves creating new database tables to track flight lines, their schedules/shifts, and the roster of volunteers (pilots) assigned to them. It includes Admin functionality to manage these and assign pilots (with auto-assign and manual override), and User functionality to view their roster.

## User Review Required
> [!IMPORTANT]
> **Roster Exclusions**: Logic will strictly enforce that pilots are NOT assigned on their `arrival_date` or `departure_date`, only dates in between.
> **Auto-Assign**: The fairness algorithm will be a "best effort" distribution based on available slots, prioritizing those with fewest duties first.
> **Conflict Checks**: Will check against simultaneous Subevents and other Duties.

## Proposed Changes

### Database Schema
#### [NEW] [add_flight_line_tables.sql](file:///c:/laragon/www/AERO-Project/docs/updates/add_flight_line_tables.sql)
- Create `flight_lines`, `flight_line_schedule`, `flight_line_roster` tables.
- Add `flight_line_duties` (bit/boolean) column to `attendees` table (if not exists).

### API (Backend)
#### [NEW] `api/src/functions/flightLines.js`
- `getFlightLines(eventId)`: Get all flight lines.
- `updateFlightLines`: Create/Update flight lines.

#### [NEW] `api/src/functions/flightLineSchedule.js`
- `getSchedule(eventId)`: Get schedule for all lines.
- `updateSchedule`: Update open/close times and duty duration.

#### [NEW] `api/src/functions/flightLineRoster.js`
- `getRoster(eventId)`: Get full roster (Admin view).
- `getMyRoster(attendeeId)`: Get specific user's roster.
- `autoAssignRoster(eventId)`: Logic to distribute duties.
- `assignDuty(manually)`: Manual override with validation.

### Frontend
#### [MODIFY] `client/src/pages/Admin/FlightLineRoster.jsx` (New file)
- Admin interface for managing the roster.
- Drag-and-drop or Grid view.
- Buttons for "Auto Assign" and "Clear Day".

#### [MODIFY] `client/src/pages/User/FlightLineRoster.jsx` (New file or modify existing placeholder)
- Read-only view for users.

#### [MODIFY] `client/src/components/AttendeeModal.jsx`
- Add "Available for Flight Line Duties" checkbox for Pilot attendees.

## Verification Plan

### Automated Tests
- None currently set up for this project.

### Manual Verification
1.  **Schema**: Run SQL script and verify tables in DB.
2.  **Registration**: Register a new pilot, check "Available for Duties", verify `flight_line_duties` flag in DB.
3.  **Admin Setup**: Create Flight Lines (e.g., "North Line", "South Line") and Schedules (e.g., 9am-5pm, 60min slots).
4.  **Auto-Assign**:
    - Trigger auto-assign for a day.
    - Verify fairness (count per pilot).
    - **Verify Exclusions**: Ensure no duties on arrival/departure dates.
    - **Verify Conflicts**: Ensure no duties overlap with existing Subevents.
5.  **Manual Override**: Move a pilot to a different slot; check validation warnings/blocks.
6.  **User View**: Log in as pilot, check "Flight Line Roster" page, see assigned duties.

SQL script

-- Create Flight Lines Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[flight_lines]') AND type in (N'U'))
BEGIN
    CREATE TABLE flight_lines (
        flight_line_id INT IDENTITY(1,1) PRIMARY KEY,
        event_id INT NOT NULL,
        flight_line_name NVARCHAR(255) NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(event_id)
    );
END

-- Create Flight Line Schedule Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[flight_line_schedule]') AND type in (N'U'))
BEGIN
    CREATE TABLE flight_line_schedule (
        schedule_id INT IDENTITY(1,1) PRIMARY KEY,
        flight_line_id INT NOT NULL,
        schedule_date DATE NOT NULL,
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        duty_duration_minutes INT NOT NULL DEFAULT 60,
        FOREIGN KEY (flight_line_id) REFERENCES flight_lines(flight_line_id)
    );
END

-- Create Flight Line Roster Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[flight_line_roster]') AND type in (N'U'))
BEGIN
    CREATE TABLE flight_line_roster (
        roster_id INT IDENTITY(1,1) PRIMARY KEY,
        flight_line_id INT NOT NULL,
        attendee_id INT NULL, -- Can be null if slot is unassigned
        roster_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        FOREIGN KEY (flight_line_id) REFERENCES flight_lines(flight_line_id),
        FOREIGN KEY (attendee_id) REFERENCES attendees(attendee_id)
    );
END

-- Add flight_line_duties to attendees if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[attendees]') AND name = 'flight_line_duties')
BEGIN
    ALTER TABLE attendees ADD flight_line_duties BIT NOT NULL DEFAULT 0;
END
