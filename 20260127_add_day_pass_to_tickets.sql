IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('event_ticket_types') AND name = 'is_day_pass')
BEGIN
    ALTER TABLE event_ticket_types ADD is_day_pass BIT DEFAULT 0 NOT NULL;
END
GO
