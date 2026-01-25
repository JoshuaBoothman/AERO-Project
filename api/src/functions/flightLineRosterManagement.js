const { app } = require('@azure/functions');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

// GET all roster slots for an event
app.http('getFlightLineRoster', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines/roster',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT 
                    flr.roster_id,
                    flr.flight_line_id,
                    flr.roster_date,
                    flr.start_time,
                    flr.end_time,
                    flr.attendee_id,
                    fl.flight_line_name,
                    p.first_name,
                    p.last_name,
                    p.person_id
                FROM flight_line_roster flr
                JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                LEFT JOIN attendees a ON flr.attendee_id = a.attendee_id
                LEFT JOIN persons p ON a.person_id = p.person_id
                WHERE fl.event_id = @eventId
                ORDER BY flr.roster_date, fl.flight_line_name, flr.start_time
            `;

            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            return { jsonBody: result };
        } catch (error) {
            context.error(`Error getting roster: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// PUT assign pilot to roster slot
app.http('assignFlightLineDuty', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'flight-line-roster/{rosterId}/assign',
    handler: async (request, context) => {
        try {
            const { rosterId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { attendee_id } = await request.json();

            if (!attendee_id) {
                return { status: 400, body: JSON.stringify({ error: "attendee_id is required" }) };
            }

            // Validate attendee has flight_line_duties enabled
            const checkQ = `
                SELECT flight_line_duties FROM attendees WHERE attendee_id = @attendeeId
            `;
            const checkResult = await query(checkQ, [{ name: 'attendeeId', type: sql.Int, value: attendee_id }]);

            if (checkResult.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Attendee not found" }) };
            }

            if (!checkResult[0].flight_line_duties) {
                return { status: 400, body: JSON.stringify({ error: "Attendee does not have flight line duties enabled" }) };
            }

            // Update roster
            const updateQ = `
                UPDATE flight_line_roster
                SET attendee_id = @attendeeId
                OUTPUT INSERTED.*
                WHERE roster_id = @rosterId
            `;

            const result = await query(updateQ, [
                { name: 'rosterId', type: sql.Int, value: rosterId },
                { name: 'attendeeId', type: sql.Int, value: attendee_id }
            ]);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Roster slot not found" }) };
            }

            return { jsonBody: result[0] };
        } catch (error) {
            context.error(`Error assigning duty: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message || "Internal Server Error" }) };
        }
    }
});

// PUT unassign pilot from roster slot
app.http('unassignFlightLineDuty', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'flight-line-roster/{rosterId}/unassign',
    handler: async (request, context) => {
        try {
            const { rosterId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const updateQ = `
                UPDATE flight_line_roster
                SET attendee_id = NULL
                OUTPUT INSERTED.*
                WHERE roster_id = @rosterId
            `;

            const result = await query(updateQ, [{ name: 'rosterId', type: sql.Int, value: rosterId }]);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Roster slot not found" }) };
            }

            return { jsonBody: result[0] };
        } catch (error) {
            context.error(`Error unassigning duty: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// PUT update roster slot times
app.http('updateFlightLineSlotTimes', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'flight-line-roster/{rosterId}/times',
    handler: async (request, context) => {
        try {
            const { rosterId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { start_time, end_time } = await request.json();

            if (!start_time || !end_time) {
                return { status: 400, body: JSON.stringify({ error: "start_time and end_time are required" }) };
            }

            // Basic validation: start < end
            if (start_time >= end_time) {
                return { status: 400, body: JSON.stringify({ error: "Start time must be before end time" }) };
            }

            const updateQ = `
                UPDATE flight_line_roster
                SET start_time = @startTime, end_time = @endTime
                OUTPUT INSERTED.*
                WHERE roster_id = @rosterId
            `;

            const result = await query(updateQ, [
                { name: 'rosterId', type: sql.Int, value: rosterId },
                { name: 'startTime', type: sql.VarChar, value: start_time },
                { name: 'endTime', type: sql.VarChar, value: end_time }
            ]);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Roster slot not found" }) };
            }

            return { jsonBody: result[0] };
        } catch (error) {
            context.error(`Error updating slot times: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message || "Internal Server Error" }) };
        }
    }
});

// DELETE clear all assignments for a specific date
app.http('clearFlightLineRosterDate', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines/roster/clear-date',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { date } = await request.json();

            if (!date) {
                return { status: 400, body: JSON.stringify({ error: "date is required" }) };
            }

            const updateQ = `
                UPDATE flr
                SET flr.attendee_id = NULL
                FROM flight_line_roster flr
                JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                WHERE fl.event_id = @eventId AND flr.roster_date = @date
            `;

            const pool = await getPool();
            const result = await pool.request()
                .input('eventId', sql.Int, eventId)
                .input('date', sql.Date, date)
                .query(updateQ);

            return {
                jsonBody: {
                    clearedCount: result.rowsAffected[0],
                    date: date
                }
            };
        } catch (error) {
            context.error(`Error clearing roster date: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
