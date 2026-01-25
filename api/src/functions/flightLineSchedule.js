const { app } = require('@azure/functions');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

// GET Schedules for a Flight Line
app.http('getFlightLineSchedule', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'flight-lines/{flightLineId}/schedule',
    handler: async (request, context) => {
        try {
            const { flightLineId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT schedule_id, flight_line_id, schedule_date, open_time, close_time, duty_duration_minutes
                FROM flight_line_schedule
                WHERE flight_line_id = @flightLineId
                ORDER BY schedule_date ASC
            `;
            const result = await query(q, [{ name: 'flightLineId', type: sql.Int, value: flightLineId }]);

            return { jsonBody: result };
        } catch (error) {
            context.error(`Error getting schedule: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// CREATE or UPDATE Schedule (with auto-slot generation)
app.http('upsertFlightLineSchedule', {
    methods: ['POST', 'PUT'],
    authLevel: 'anonymous',
    route: 'flight-lines/{flightLineId}/schedule',
    handler: async (request, context) => {
        try {
            const { flightLineId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { schedule_date, open_time, close_time, duty_duration_minutes } = await request.json();

            if (!schedule_date || !open_time || !close_time || !duty_duration_minutes) {
                return { status: 400, body: JSON.stringify({ error: "All schedule fields are required" }) };
            }

            // Validate times
            if (open_time >= close_time) {
                return { status: 400, body: JSON.stringify({ error: "Close time must be after open time" }) };
            }

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Check if schedule exists for this date
                const checkQ = `
                    SELECT schedule_id FROM flight_line_schedule 
                    WHERE flight_line_id = @flightLineId AND schedule_date = @scheduleDate
                `;
                const checkReq = new sql.Request(transaction);
                const existing = await checkReq
                    .input('flightLineId', sql.Int, flightLineId)
                    .input('scheduleDate', sql.Date, schedule_date)
                    .query(checkQ);

                let scheduleId;
                let savedSchedule;

                if (existing.recordset.length > 0) {
                    // UPDATE existing schedule
                    scheduleId = existing.recordset[0].schedule_id;

                    const updateQ = `
                        UPDATE flight_line_schedule
                        SET open_time = @openTime, close_time = @closeTime, duty_duration_minutes = @duration
                        OUTPUT INSERTED.*
                        WHERE schedule_id = @scheduleId
                    `;
                    const updateReq = new sql.Request(transaction);
                    const updateResult = await updateReq
                        .input('scheduleId', sql.Int, scheduleId)
                        .input('openTime', sql.VarChar, open_time)
                        .input('closeTime', sql.VarChar, close_time)
                        .input('duration', sql.Int, duty_duration_minutes)
                        .query(updateQ);

                    savedSchedule = updateResult.recordset[0];

                    // Delete existing roster slots for this schedule
                    const deleteRosterQ = `
                        DELETE FROM flight_line_roster 
                        WHERE flight_line_id = @flightLineId AND roster_date = @scheduleDate
                    `;
                    const deleteReq = new sql.Request(transaction);
                    await deleteReq
                        .input('flightLineId', sql.Int, flightLineId)
                        .input('scheduleDate', sql.Date, schedule_date)
                        .query(deleteRosterQ);

                } else {
                    // INSERT new schedule
                    const insertQ = `
                        INSERT INTO flight_line_schedule (flight_line_id, schedule_date, open_time, close_time, duty_duration_minutes)
                        OUTPUT INSERTED.*
                        VALUES (@flightLineId, @scheduleDate, @openTime, @closeTime, @duration)
                    `;
                    const insertReq = new sql.Request(transaction);
                    const insertResult = await insertReq
                        .input('flightLineId', sql.Int, flightLineId)
                        .input('scheduleDate', sql.Date, schedule_date)
                        .input('openTime', sql.VarChar, open_time)
                        .input('closeTime', sql.VarChar, close_time)
                        .input('duration', sql.Int, duty_duration_minutes)
                        .query(insertQ);

                    savedSchedule = insertResult.recordset[0];
                    scheduleId = savedSchedule.schedule_id;
                }

                // AUTO-GENERATE ROSTER SLOTS
                // Parse times (format: HH:MM:SS or HH:MM)
                const parseTime = (timeStr) => {
                    const parts = timeStr.split(':');
                    return { hours: parseInt(parts[0]), minutes: parseInt(parts[1]) };
                };

                const openParsed = parseTime(open_time);
                const closeParsed = parseTime(close_time);

                // Calculate total minutes
                const openMinutes = openParsed.hours * 60 + openParsed.minutes;
                const closeMinutes = closeParsed.hours * 60 + closeParsed.minutes;
                const totalMinutes = closeMinutes - openMinutes;

                // Generate slots
                const slots = [];
                let currentMinutes = openMinutes;

                while (currentMinutes + duty_duration_minutes <= closeMinutes) {
                    const startHours = Math.floor(currentMinutes / 60);
                    const startMins = currentMinutes % 60;
                    const endMinutes = currentMinutes + duty_duration_minutes;
                    const endHours = Math.floor(endMinutes / 60);
                    const endMins = endMinutes % 60;

                    const startTime = `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}:00`;
                    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

                    slots.push({ startTime, endTime });
                    currentMinutes += duty_duration_minutes;
                }

                // Insert roster slots
                for (const slot of slots) {
                    const rosterInsertQ = `
                        INSERT INTO flight_line_roster (flight_line_id, attendee_id, roster_date, start_time, end_time)
                        VALUES (@flightLineId, NULL, @rosterDate, @startTime, @endTime)
                    `;
                    const rosterReq = new sql.Request(transaction);
                    await rosterReq
                        .input('flightLineId', sql.Int, flightLineId)
                        .input('rosterDate', sql.Date, schedule_date)
                        .input('startTime', sql.VarChar, slot.startTime)
                        .input('endTime', sql.VarChar, slot.endTime)
                        .query(rosterInsertQ);
                }

                await transaction.commit();

                return {
                    status: existing.recordset.length > 0 ? 200 : 201,
                    jsonBody: {
                        ...savedSchedule,
                        slotsGenerated: slots.length
                    }
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            context.error(`Error saving schedule: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message || "Internal Server Error" }) };
        }
    }
});

// DELETE Schedule (and associated roster slots)
app.http('deleteFlightLineSchedule', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'flight-line-schedule/{scheduleId}',
    handler: async (request, context) => {
        try {
            const { scheduleId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Get flight_line_id and date before deletion
                const getQ = `SELECT flight_line_id, schedule_date FROM flight_line_schedule WHERE schedule_id = @scheduleId`;
                const getReq = new sql.Request(transaction);
                const getResult = await getReq.input('scheduleId', sql.Int, scheduleId).query(getQ);

                if (getResult.recordset.length === 0) {
                    await transaction.rollback();
                    return { status: 404, body: JSON.stringify({ error: "Schedule not found" }) };
                }

                const { flight_line_id, schedule_date } = getResult.recordset[0];

                // Delete associated roster slots
                const deleteRosterQ = `
                    DELETE FROM flight_line_roster 
                    WHERE flight_line_id = @flightLineId AND roster_date = @scheduleDate
                `;
                const deleteRosterReq = new sql.Request(transaction);
                await deleteRosterReq
                    .input('flightLineId', sql.Int, flight_line_id)
                    .input('scheduleDate', sql.Date, schedule_date)
                    .query(deleteRosterQ);

                // Delete schedule
                const deleteQ = `DELETE FROM flight_line_schedule WHERE schedule_id = @scheduleId`;
                const deleteReq = new sql.Request(transaction);
                await deleteReq.input('scheduleId', sql.Int, scheduleId).query(deleteQ);

                await transaction.commit();
                return { status: 204 };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            context.error(`Error deleting schedule: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});
