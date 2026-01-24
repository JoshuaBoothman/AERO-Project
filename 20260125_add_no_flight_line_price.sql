-- =============================================
-- Author:      Antigravity Agent
-- Create Date: 2026-01-25
-- Description: Adds 'price_no_flight_line' column to 'event_ticket_types' table to support differential pricing for pilots refusing duties.
-- 
-- INSTRUCTIONS:
-- Run this script on BOTH:
-- 1. sqldb-aero-dev
-- 2. sqldb-aero-master
-- =============================================

IF NOT EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'event_ticket_types' 
      AND COLUMN_NAME = 'price_no_flight_line'
)
BEGIN
    ALTER TABLE event_ticket_types
    ADD price_no_flight_line DECIMAL(10, 2) NULL;
    
    PRINT 'Column [price_no_flight_line] added to [event_ticket_types].';
END
ELSE
BEGIN
    PRINT 'Column [price_no_flight_line] already exists in [event_ticket_types].';
END
GO
