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
