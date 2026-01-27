const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { sendPublicRegistrationEmail } = require('../lib/emailService');

function generateTicketCode() {
    return 'AS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.http('publicRegistration', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'public/register',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { public_event_day_id, firstName, lastName, email, adults, children, subscribeToEmails } = body;

            // 1. Validate Input
            if (!public_event_day_id || !firstName || !lastName || !email) {
                return { status: 400, jsonBody: { error: 'Missing required fields' } };
            }

            const adultsCount = parseInt(adults) || 1;
            const childrenCount = parseInt(children) || 0;

            // 2. Fetch Event Details (for Email)
            const dayDetails = await query(`
                SELECT pd.date, pd.title, e.name as event_name
                FROM public_event_days pd
                JOIN events e ON pd.event_id = e.event_id
                WHERE pd.id = @id
            `, [{ name: 'id', type: sql.Int, value: public_event_day_id }]);

            if (dayDetails.length === 0) {
                return { status: 404, jsonBody: { error: 'Invalid Event Day' } };
            }

            const eventDate = new Date(dayDetails[0].date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
            const eventName = dayDetails[0].event_name;
            const ticketCode = generateTicketCode();

            // 3. Insert Registration

            await query(`
                INSERT INTO public_registrations 
                (public_event_day_id, first_name, last_name, email, adults_count, children_count, ticket_code, subscribe_to_emails)
                VALUES 
                (@dayId, @fname, @lname, @email, @adults, @children, @code, @sub)
            `, [
                { name: 'dayId', type: sql.Int, value: public_event_day_id },
                { name: 'fname', type: sql.NVarChar, value: firstName },
                { name: 'lname', type: sql.NVarChar, value: lastName },
                { name: 'email', type: sql.NVarChar, value: email },
                { name: 'adults', type: sql.Int, value: adultsCount },
                { name: 'children', type: sql.Int, value: childrenCount },
                { name: 'code', type: sql.VarChar, value: ticketCode },
                { name: 'sub', type: sql.Bit, value: subscribeToEmails ? 1 : 0 }
            ]);

            // 4. Send Email
            await sendPublicRegistrationEmail(email, firstName, ticketCode, eventDate, adultsCount, childrenCount, eventName);

            return { status: 201, jsonBody: { success: true, ticketCode } };

        } catch (error) {
            context.error(`Error in publicRegistration: ${error.message}`);
            return { status: 500, jsonBody: { error: 'Internal Server Error' } };
        }
    }
});
