const { app } = require('@azure/functions');
const { query, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('updateAttendee', {
    methods: ['PUT'],
    route: 'attendees/{attendeeId}',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const decoded = validateToken(request);
        if (!decoded) {
            return { status: 401, body: "Unauthorized" };
        }

        const attendeeId = request.params.attendeeId;
        const { firstName, lastName, email, phoneNumber, country } = await request.json();

        try {
            // 1. Security Check: Ensure the user owns the order associated with this attendee
            const checkQuery = `
                SELECT a.person_id
                FROM attendees a
                JOIN order_items oi ON a.attendee_id = oi.attendee_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE a.attendee_id = @attendeeId AND o.user_id = @userId
            `;

            const checkResult = await query(checkQuery, [
                { name: 'attendeeId', type: sql.Int, value: attendeeId },
                { name: 'userId', type: sql.Int, value: decoded.userId }
            ]);

            if (checkResult.length === 0) {
                return { status: 403, body: "Forbidden: You do not have permission to modify this attendee." };
            }

            const personId = checkResult[0].person_id;

            // 2. Update the Person record
            const updateQuery = `
                UPDATE persons
                SET 
                    first_name = @firstName,
                    last_name = @lastName,
                    email = @email,
                    phone_number = @phoneNumber,
                    country = @country
                WHERE person_id = @personId
            `;

            await query(updateQuery, [
                { name: 'firstName', type: sql.NVarChar, value: firstName },
                { name: 'lastName', type: sql.NVarChar, value: lastName },
                { name: 'email', type: sql.NVarChar, value: email },
                { name: 'phoneNumber', type: sql.VarChar, value: phoneNumber || null },
                { name: 'country', type: sql.NVarChar, value: country || null },
                { name: 'personId', type: sql.Int, value: personId }
            ]);

            return {
                status: 200,
                body: JSON.stringify({ message: "Attendee details updated successfully" })
            };

        } catch (error) {
            context.log(`Error in updateAttendee: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});
