const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');

app.http('managePublicEventDays', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'public-days/{id?}',
    handler: async (request, context) => {
        try {
            const method = request.method;
            const id = request.params.id;

            // Helper to parse "HH:MM" to Date for sql.Time
            const parseTime = (t) => {
                if (!t) return null;
                const parts = t.split(':');
                if (parts.length < 2) return null;
                const d = new Date(Date.UTC(1970, 0, 1, parts[0], parts[1]));
                return d;
            };

            if (method === 'GET') {
                // If ID is provided, it might be fetching by public_event_day_id, 
                // BUT usually we want days for an EVENT. 
                // Let's check query params.
                // GET /api/public-days?eventId=123
                const eventId = request.query.get('eventId');

                if (eventId) {
                    const result = await query(`
                        SELECT id, event_id, title, description, date, is_active,
                               CONVERT(varchar(5), start_time, 108) as start_time,
                               CONVERT(varchar(5), end_time, 108) as end_time
                        FROM public_event_days 
                        WHERE event_id = @eventId 
                        ORDER BY date ASC
                    `, [{ name: 'eventId', type: sql.Int, value: eventId }]);
                    return { jsonBody: result };
                } else if (id) {
                    const result = await query(`
                        SELECT id, event_id, title, description, date, is_active,
                               CONVERT(varchar(5), start_time, 108) as start_time,
                               CONVERT(varchar(5), end_time, 108) as end_time
                        FROM public_event_days 
                        WHERE id = @id
                    `, [{ name: 'id', type: sql.Int, value: id }]);
                    return { jsonBody: result[0] || {} };
                } else {
                    return { status: 400, jsonBody: { error: 'Missing eventId or id' } };
                }
            }

            // For Write operations, we should perform Authorization check (Admin Only)
            // Simulating Admin Check (In real app, verify JWT header)
            // const authHeader = request.headers.get('Authorization'); // ... logic

            if (method === 'POST') {
                const body = await request.json();
                const { event_id, title, description, date, start_time, end_time } = body;


                if (!event_id || !title || !date) {
                    return { status: 400, jsonBody: { error: 'Missing required fields' } };
                }

                const result = await query(`
                    INSERT INTO public_event_days (event_id, title, description, date, start_time, end_time, is_active)
                    OUTPUT INSERTED.id
                    VALUES (@eventId, @title, @description, @date, @startTime, @endTime, 1)
                `, [
                    { name: 'eventId', type: sql.Int, value: event_id },
                    { name: 'title', type: sql.NVarChar, value: title },
                    { name: 'description', type: sql.NVarChar, value: description || '' },
                    { name: 'date', type: sql.Date, value: date },
                    { name: 'startTime', type: sql.Time, value: parseTime(start_time) },
                    { name: 'endTime', type: sql.Time, value: parseTime(end_time) }
                ]);

                const newId = result[0].id;

                // Fetch with consistent formatting
                const fetched = await query(`
                    SELECT id, event_id, title, description, date, is_active,
                           CONVERT(varchar(5), start_time, 108) as start_time,
                           CONVERT(varchar(5), end_time, 108) as end_time
                    FROM public_event_days 
                    WHERE id = @id
                `, [{ name: 'id', type: sql.Int, value: newId }]);

                return { status: 201, jsonBody: fetched[0] };
            }

            if (method === 'PUT') {
                if (!id) return { status: 400, jsonBody: { error: 'Missing ID' } };
                const body = await request.json();
                const { title, description, date, start_time, end_time, is_active } = body;

                // Build Dynamic Update
                // Simplify for now: Update all fields
                const result = await query(`
                    UPDATE public_event_days
                    SET title = @title,
                        description = @description,
                        date = @date,
                        start_time = @startTime,
                        end_time = @endTime,
                        is_active = @isActive
                    WHERE id = @id
                `, [
                    { name: 'id', type: sql.Int, value: id },
                    { name: 'title', type: sql.NVarChar, value: title },
                    { name: 'description', type: sql.NVarChar, value: description },
                    { name: 'date', type: sql.Date, value: date },
                    { name: 'startTime', type: sql.Time, value: parseTime(start_time) },
                    { name: 'endTime', type: sql.Time, value: parseTime(end_time) },
                    { name: 'isActive', type: sql.Bit, value: is_active }
                ]);

                // Fetch with consistent formatting
                const fetched = await query(`
                    SELECT id, event_id, title, description, date, is_active,
                           CONVERT(varchar(5), start_time, 108) as start_time,
                           CONVERT(varchar(5), end_time, 108) as end_time
                    FROM public_event_days 
                    WHERE id = @id
                `, [{ name: 'id', type: sql.Int, value: id }]);

                return { jsonBody: fetched[0] };
            }

            if (method === 'DELETE') {
                if (!id) return { status: 400, jsonBody: { error: 'Missing ID' } };

                // Check dependencies? public_registrations. 
                // If registrations exist, maybe soft delete or block.
                // For now, hard delete (will fail if FK exists unless cascade, user didn't specify cascade).
                // Better: Check first.

                const registrations = await query(`SELECT COUNT(*) as count FROM public_registrations WHERE public_event_day_id = @id`, [{ name: 'id', type: sql.Int, value: id }]);
                if (registrations[0].count > 0) {
                    return { status: 409, jsonBody: { error: 'Cannot delete: Registrations exist for this day.' } };
                }

                await query(`DELETE FROM public_event_days WHERE id = @id`, [{ name: 'id', type: sql.Int, value: id }]);
                return { status: 204 };
            }

        } catch (error) {
            context.error(`Error in managePublicEventDays: ${error.message}`);
            return { status: 500, jsonBody: { error: 'Internal Server Error' } };
        }
    }
});
