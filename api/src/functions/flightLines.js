const { app } = require('@azure/functions');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

// GET Flight Lines for an Event
app.http('getFlightLines', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT flight_line_id, event_id, flight_line_name
                FROM flight_lines
                WHERE event_id = @eventId
                ORDER BY flight_line_name ASC
            `;
            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            return { jsonBody: result };
        } catch (error) {
            context.error(`Error getting flight lines: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// CREATE Flight Line
app.http('createFlightLine', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { flight_line_name } = await request.json();

            if (!flight_line_name || !flight_line_name.trim()) {
                return { status: 400, body: JSON.stringify({ error: "Flight line name is required" }) };
            }

            const insertQ = `
                INSERT INTO flight_lines (event_id, flight_line_name)
                OUTPUT INSERTED.*
                VALUES (@eventId, @flightLineName)
            `;

            const result = await query(insertQ, [
                { name: 'eventId', type: sql.Int, value: eventId },
                { name: 'flightLineName', type: sql.NVarChar, value: flight_line_name.trim() }
            ]);

            return { status: 201, jsonBody: result[0] };
        } catch (error) {
            context.error(`Error creating flight line: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// UPDATE Flight Line
app.http('updateFlightLine', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'flight-lines/{flightLineId}',
    handler: async (request, context) => {
        try {
            const { flightLineId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { flight_line_name } = await request.json();

            if (!flight_line_name || !flight_line_name.trim()) {
                return { status: 400, body: JSON.stringify({ error: "Flight line name is required" }) };
            }

            const updateQ = `
                UPDATE flight_lines
                SET flight_line_name = @flightLineName
                OUTPUT INSERTED.*
                WHERE flight_line_id = @flightLineId
            `;

            const result = await query(updateQ, [
                { name: 'flightLineId', type: sql.Int, value: flightLineId },
                { name: 'flightLineName', type: sql.NVarChar, value: flight_line_name.trim() }
            ]);

            if (result.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Flight line not found" }) };
            }

            return { jsonBody: result[0] };
        } catch (error) {
            context.error(`Error updating flight line: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// DELETE Flight Line
app.http('deleteFlightLine', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'flight-lines/{flightLineId}',
    handler: async (request, context) => {
        try {
            const { flightLineId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            // Check if flight line has associated roster entries
            const checkQ = `SELECT COUNT(*) as count FROM flight_line_roster WHERE flight_line_id = @flightLineId`;
            const checkResult = await query(checkQ, [{ name: 'flightLineId', type: sql.Int, value: flightLineId }]);

            if (checkResult[0].count > 0) {
                return { status: 409, body: JSON.stringify({ error: "Cannot delete flight line with existing roster entries" }) };
            }

            const deleteQ = `DELETE FROM flight_lines WHERE flight_line_id = @flightLineId`;
            await query(deleteQ, [{ name: 'flightLineId', type: sql.Int, value: flightLineId }]);

            return { status: 204 };
        } catch (error) {
            context.error(`Error deleting flight line: ${error.message}`);
            if (error.message.includes('REFERENCE constraint')) {
                return { status: 409, body: JSON.stringify({ error: "Cannot delete flight line because it has associated schedules or roster entries." }) };
            }
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
