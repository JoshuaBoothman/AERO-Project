const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('debugStatus', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-status',
    handler: async (request, context) => {
        const report = {
            env: {
                hasSqlConn: !!process.env.SQL_CONNECTION_STRING,
                hasJwtSecret: !!process.env.JWT_SECRET,
                nodeEnv: process.env.NODE_ENV
            },
            auth: {
                headerPresent: !!request.headers.get('Authorization'),
                tokenValid: false,
                decoded: null,
                error: null
            },
            db: {
                connected: false,
                version: null,
                error: null
            },
            data: {
                eventsCount: 0,
                adminEventsQuery: null,
                publicEventsQuery: null
            }
        };

        // 1. Check Auth (if provided)
        try {
            const user = validateToken(request);
            if (user) {
                report.auth.tokenValid = true;
                report.auth.decoded = user;
            } else {
                report.auth.error = "Token invalid or missing";
            }
        } catch (e) {
            report.auth.error = e.message;
        }

        // 2. Check DB
        try {
            const pool = await getPool();
            report.db.connected = true;

            // Version check
            const verRes = await pool.request().query("SELECT @@VERSION as v");
            report.db.version = verRes.recordset[0].v;

            // 3. Data Check (Events)
            // Admin Query count
            const adminQ = await pool.request().query("SELECT COUNT(*) as c FROM events");
            report.data.adminEventsQuery = adminQ.recordset[0].c;

            // Public Query count
            const pubQ = await pool.request().query("SELECT COUNT(*) as c FROM events WHERE is_public_viewable = 1");
            report.data.publicEventsQuery = pubQ.recordset[0].c;

        } catch (e) {
            report.db.error = e.message;
        }

        return {
            status: 200,
            jsonBody: report
        };
    }
});
