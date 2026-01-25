const { app } = require('@azure/functions');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');

// Check if roster has any assignments
app.http('checkFlightLineRosterStatus', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines/roster-status',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const q = `
                SELECT COUNT(*) as assignedCount
                FROM flight_line_roster flr
                JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                WHERE fl.event_id = @eventId AND flr.attendee_id IS NOT NULL
            `;
            const result = await query(q, [{ name: 'eventId', type: sql.Int, value: eventId }]);

            return {
                jsonBody: {
                    hasAssignments: result[0].assignedCount > 0,
                    assignedCount: result[0].assignedCount
                }
            };
        } catch (error) {
            context.error(`Error checking roster status: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
        }
    }
});

// Auto-assign pilots to flight line roster slots
app.http('autoAssignFlightLineRoster', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'events/{eventId}/flight-lines/auto-assign',
    handler: async (request, context) => {
        try {
            const { eventId } = request.params;
            const user = validateToken(request);
            if (!user || user.role !== 'admin') {
                return { status: 403, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const { replaceExisting } = await request.json();

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Get event dates for validation
                const eventQ = `SELECT start_date, end_date FROM events WHERE event_id = @eventId`;
                const eventReq = new sql.Request(transaction);
                const eventResult = await eventReq.input('eventId', sql.Int, eventId).query(eventQ);

                if (eventResult.recordset.length === 0) {
                    await transaction.rollback();
                    return { status: 404, body: JSON.stringify({ error: "Event not found" }) };
                }

                // 2. Get all eligible pilots (flight_line_duties = 1)
                const pilotsQ = `
                    SELECT a.attendee_id, a.person_id, a.arrival_date, a.departure_date
                    FROM attendees a
                    WHERE a.event_id = @eventId AND a.flight_line_duties = 1 AND a.status = 'Registered'
                `;
                const pilotsReq = new sql.Request(transaction);
                const pilotsResult = await pilotsReq.input('eventId', sql.Int, eventId).query(pilotsQ);
                const eligiblePilots = pilotsResult.recordset;

                if (eligiblePilots.length === 0) {
                    await transaction.rollback();
                    return { status: 400, body: JSON.stringify({ error: "No pilots available for flight line duties" }) };
                }

                // 3. Get all empty roster slots (or all if replaceExisting)
                const slotsQ = replaceExisting
                    ? `
                        SELECT flr.roster_id, flr.flight_line_id, flr.roster_date, flr.start_time, flr.end_time
                        FROM flight_line_roster flr
                        JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                        WHERE fl.event_id = @eventId
                        ORDER BY flr.roster_date, flr.start_time
                    `
                    : `
                        SELECT flr.roster_id, flr.flight_line_id, flr.roster_date, flr.start_time, flr.end_time
                        FROM flight_line_roster flr
                        JOIN flight_lines fl ON flr.flight_line_id = fl.flight_line_id
                        WHERE fl.event_id = @eventId AND flr.attendee_id IS NULL
                        ORDER BY flr.roster_date, flr.start_time
                    `;

                const slotsReq = new sql.Request(transaction);
                const slotsResult = await slotsReq.input('eventId', sql.Int, eventId).query(slotsQ);
                const slots = slotsResult.recordset;

                if (slots.length === 0) {
                    await transaction.rollback();
                    return { status: 400, body: JSON.stringify({ error: "No slots available to assign" }) };
                }

                // 4. Get subevent registrations for conflict checking
                const subeventsQ = `
                    SELECT oi.attendee_id, se.start_time, se.end_time
                    FROM subevent_registrations sr
                    JOIN order_items oi ON sr.order_item_id = oi.order_item_id
                    JOIN subevents se ON sr.subevent_id = se.subevent_id
                    WHERE se.event_id = @eventId
                `;
                const subeventsReq = new sql.Request(transaction);
                const subeventsResult = await subeventsReq.input('eventId', sql.Int, eventId).query(subeventsQ);
                const subeventRegistrations = subeventsResult.recordset;

                // 5. Build pilot availability map
                const isPilotAvailable = (pilot, slotDate, slotStartTime, slotEndTime) => {
                    const slotDateObj = new Date(slotDate);

                    // Check arrival/departure dates
                    if (pilot.arrival_date) {
                        const arrivalDate = new Date(pilot.arrival_date);
                        if (slotDateObj < arrivalDate.setHours(0, 0, 0, 0)) {
                            return false;
                        }
                    }

                    if (pilot.departure_date) {
                        const departureDate = new Date(pilot.departure_date);
                        if (slotDateObj > departureDate.setHours(0, 0, 0, 0)) {
                            return false;
                        }
                    }

                    // Check subevent conflicts (start_time and end_time are datetime2)
                    const conflictingSubevents = subeventRegistrations.filter(sr => {
                        if (sr.attendee_id !== pilot.attendee_id) return false;

                        const subeventStart = new Date(sr.start_time);
                        const subeventEnd = new Date(sr.end_time);

                        // Check if same date
                        if (subeventStart.toDateString() !== slotDateObj.toDateString()) return false;

                        // Extract times for overlap check (HH:MM format)
                        const slotStart = slotStartTime.substring(0, 5); // HH:MM
                        const slotEnd = slotEndTime.substring(0, 5);
                        const seStart = subeventStart.toTimeString().substring(0, 5);
                        const seEnd = subeventEnd.toTimeString().substring(0, 5);

                        // Check for time overlap
                        return (slotStart < seEnd && slotEnd > seStart);
                    });

                    return conflictingSubevents.length === 0;
                };

                // 6. Fair distribution algorithm
                // Track assignments per pilot for fairness
                const pilotAssignmentCount = {};
                eligiblePilots.forEach(p => {
                    pilotAssignmentCount[p.attendee_id] = 0;
                });

                const assignments = [];

                // Shuffle pilots to randomize starting order
                const shuffledPilots = [...eligiblePilots].sort(() => Math.random() - 0.5);

                for (const slot of slots) {
                    // Find available pilots for this slot
                    const availablePilots = shuffledPilots.filter(pilot =>
                        isPilotAvailable(pilot, slot.roster_date, slot.start_time, slot.end_time)
                    );

                    if (availablePilots.length === 0) {
                        // No pilots available for this slot, skip it
                        continue;
                    }

                    // Sort by assignment count (least assigned first) for fairness
                    availablePilots.sort((a, b) =>
                        pilotAssignmentCount[a.attendee_id] - pilotAssignmentCount[b.attendee_id]
                    );

                    // Assign the pilot with least assignments
                    const selectedPilot = availablePilots[0];

                    assignments.push({
                        roster_id: slot.roster_id,
                        attendee_id: selectedPilot.attendee_id
                    });

                    pilotAssignmentCount[selectedPilot.attendee_id]++;
                }

                // 7. Update roster with assignments
                for (const assignment of assignments) {
                    const updateQ = `
                        UPDATE flight_line_roster
                        SET attendee_id = @attendeeId
                        WHERE roster_id = @rosterId
                    `;
                    const updateReq = new sql.Request(transaction);
                    await updateReq
                        .input('rosterId', sql.Int, assignment.roster_id)
                        .input('attendeeId', sql.Int, assignment.attendee_id)
                        .query(updateQ);
                }

                await transaction.commit();

                return {
                    jsonBody: {
                        success: true,
                        totalSlots: slots.length,
                        assignedSlots: assignments.length,
                        unassignedSlots: slots.length - assignments.length,
                        pilotsUsed: Object.keys(pilotAssignmentCount).filter(id => pilotAssignmentCount[id] > 0).length,
                        distributionStats: pilotAssignmentCount
                    }
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            context.error(`Error auto-assigning roster: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message || "Internal Server Error" }) };
        }
    }
});
