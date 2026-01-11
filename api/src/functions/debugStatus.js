const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');
const jwt = require('jsonwebtoken');

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
            const secret = process.env.JWT_SECRET || "dev-secret-key-change-me";
            report.auth.secretPrefix = secret.substring(0, 3) + "***"; // Safety check

            const authHeader = request.headers.get('Authorization');
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, secret);
                    if (decoded) {
                        report.auth.tokenValid = true;
                        report.auth.decoded = decoded;
                    }
                } catch (jwtErr) {
                    report.auth.error = `JWT Verify Failed: ${jwtErr.message}`;
                    // Debug: Try verifying with the Dev Key to see if that's what we have
                    try {
                        const devDecoded = jwt.verify(token, "dev-secret-key-change-me");
                        if (devDecoded) {
                            report.auth.signedWithDevKey = true;
                            report.auth.error += " (BUT token is valid with DEV KEY!)";
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            } else {
                report.auth.error = "No Authorization header found";
            }
        } catch (e) {
            report.auth.error = `Unexpected error: ${e.message}`;
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
