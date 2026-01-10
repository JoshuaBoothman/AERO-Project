const { app } = require('@azure/functions');
const db = require('../lib/db');
const { validateToken } = require('../lib/auth');

const fs = require('fs');
const path = require('path');

function logToFile(msg) {
    const logPath = path.join(__dirname, '../../debug.log');
    fs.appendFileSync(logPath, new Date().toISOString() + ': ' + msg + '\n');
}

app.http('getEvents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'events',
    handler: async (request, context) => {
        try {
            logToFile("getEvents triggered");
            // Check if loading user is an admin
            let isAdmin = false;
            try {
                const user = validateToken(request);
                if (user && user.role === 'admin') {
                    isAdmin = true;
                }
            } catch (e) {
                // Token might be missing or invalid, treat as public
                logToFile(`Admin check failed: ${e.message}`);
            }

            let query;

            if (isAdmin) {
                // Admin sees ALL events (Draft, Archived, etc)
                query = `
                    SELECT 
                        e.event_id, 
                        e.name, 
                        e.slug,
                        e.description,
                        e.banner_url,
                        e.start_date, 
                        e.end_date, 
                        e.status,
                        e.is_public_viewable,
                        v.name as venue_name,
                        v.city,
                        v.state
                    FROM events e
                    LEFT JOIN venues v ON e.venue_id = v.venue_id
                    ORDER BY e.start_date DESC
                `;
            } else {
                // Public only sees viewable events
                // CHANGED: Use LEFT JOIN so events without venues still show up
                query = `
                    SELECT 
                        e.event_id, 
                        e.name, 
                        e.slug,
                        e.description,
                        e.banner_url,
                        e.start_date, 
                        e.end_date, 
                        e.status,
                        e.is_public_viewable,
                        v.name as venue_name,
                        v.city,
                        v.state
                    FROM events e
                    LEFT JOIN venues v ON e.venue_id = v.venue_id
                    WHERE e.is_public_viewable = 1
                    ORDER BY e.start_date DESC
                `;
            }

            logToFile(`Admin: ${isAdmin}`);
            const events = await db.query(query);
            logToFile(`Found ${events.length} events`);
            if (events.length > 0) {
                logToFile(`First event: ${JSON.stringify(events[0])}`);
                // Check if venue is null
                if (!events[0].venue_name) logToFile('WARN: First event has no venue info (joined).');
            } else {
                logToFile('No events found in query result.');
            }

            return {
                status: 200,
                jsonBody: events
            };

        } catch (error) {
            logToFile(`Error: ${error.message}`);
            context.error(`Error fetching events: ${error.message}`);
            return {
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" })
            };
        }
    }
});