const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, sql, getPool } = require('../lib/db');
const { validateToken } = require('../lib/auth');
const { sendLegacyWelcomeEmail } = require('../lib/emailService');

app.http('createLegacyBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // 1. Auth Check (Admin Only)
        const adminUser = validateToken(request);
        if (!adminUser || adminUser.role !== 'admin') {
            return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
        }

        try {
            const { firstName, lastName, email, ausNumber, campsiteId, eventId, arrivalDate, departureDate } = await request.json();

            if (!firstName || !lastName || !email || !campsiteId || !eventId || !arrivalDate || !departureDate) {
                return { status: 400, body: JSON.stringify({ error: "Missing required fields. Please ensure all fields including arrival and departure dates are filled." }) };
            }

            // Validate dates
            const checkIn = new Date(arrivalDate);
            const checkOut = new Date(departureDate);
            if (checkOut <= checkIn) {
                return { status: 400, body: JSON.stringify({ error: "Departure date must be after arrival date." }) };
            }

            // AUS Number is required by DB schema. If not provided (should be UI enforced), use a placeholder to avoid crash, 
            // but ideally we want real data. For Legacy imports, we might not always have it? 
            // Let's assume passed or generate a unique placeholder if really needed, but better to enforce.
            // Using a text placeholder "TBA-[Timestamp]" if missing to allow process, assuming admin will fix or user will overwrite on claim.
            const finalAusNumber = ausNumber || `LEGACY-${Date.now()}`;

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 0. Ensure Schema (Lazy Migration)
                try {
                    await pool.request().query(`
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_legacy_import')
                        BEGIN
                            ALTER TABLE users ADD is_legacy_import BIT DEFAULT 0;
                        END
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'booking_source')
                        BEGIN
                            ALTER TABLE orders ADD booking_source NVARCHAR(50) DEFAULT 'Online';
                        END
                    `);
                } catch (ignored) {
                    // Ignore if already running
                }

                // 1. Get or Create User
                let userId;
                let isNewUser = false;
                let verificationToken = crypto.randomBytes(32).toString('hex');

                const userCheck = await new sql.Request(transaction)
                    .input('email', sql.NVarChar, email)
                    .query("SELECT user_id, is_email_verified FROM users WHERE email = @email");

                if (userCheck.recordset.length > 0) {
                    userId = userCheck.recordset[0].user_id;
                    // Existing user - we will just link the order to them
                } else {
                    isNewUser = true;
                    // Create Placeholder User
                    // Random password
                    const randomPass = crypto.randomBytes(16).toString('hex');
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(randomPass, salt);

                    const tokenExpires = new Date();
                    tokenExpires.setHours(tokenExpires.getHours() + 48); // 48 hours for legacy

                    const userRes = await new sql.Request(transaction)
                        .input('e', sql.NVarChar, email)
                        .input('h', sql.NVarChar, hash)
                        .input('fn', sql.NVarChar, firstName)
                        .input('ln', sql.NVarChar, lastName)
                        .input('aus', sql.NVarChar, finalAusNumber) // Insert AUS Number
                        .input('tok', sql.NVarChar, verificationToken)
                        .input('exp', sql.DateTime, tokenExpires)
                        .query(`
                            INSERT INTO users (email, password_hash, first_name, last_name, aus_number, is_email_verified, verification_token, verification_token_expires, is_legacy_import)
                            VALUES (@e, @h, @fn, @ln, @aus, 0, @tok, @exp, 1);
                            SELECT SCOPE_IDENTITY() AS id;
                        `);
                    userId = userRes.recordset[0].id;
                }

                // 2. Get or Create Person
                let personId;
                const personCheck = await new sql.Request(transaction)
                    .input('uid', sql.Int, userId)
                    .query("SELECT person_id FROM persons WHERE user_id = @uid");

                if (personCheck.recordset.length > 0) {
                    personId = personCheck.recordset[0].person_id;
                } else {
                    const personRes = await new sql.Request(transaction)
                        .input('uid', sql.Int, userId)
                        .input('fn', sql.NVarChar, firstName)
                        .input('ln', sql.NVarChar, lastName)
                        .input('em', sql.NVarChar, email)
                        .query("INSERT INTO persons (user_id, first_name, last_name, email) VALUES (@uid, @fn, @ln, @em); SELECT SCOPE_IDENTITY() AS id");
                    personId = personRes.recordset[0].id;
                }

                // 2b. Get or Create Legacy Placeholder Ticket Type (Required for Attendee)
                // We need a ticket type to attach the attendee to, even if they haven't paid.
                let ticketTypeId;
                const ticketTypeCheck = await new sql.Request(transaction)
                    .input('eid', sql.Int, eventId)
                    .query("SELECT ticket_type_id FROM event_ticket_types WHERE event_id = @eid AND name = 'Legacy Booking Placeholder'");

                if (ticketTypeCheck.recordset.length > 0) {
                    ticketTypeId = ticketTypeCheck.recordset[0].ticket_type_id;
                } else {
                    const ttRes = await new sql.Request(transaction)
                        .input('eid', sql.Int, eventId)
                        .query(`
                            INSERT INTO event_ticket_types (event_id, name, description, price, system_role, includes_merch, price_no_flight_line) 
                            VALUES (@eid, 'Legacy Booking Placeholder', 'System type for imported bookings', 0, 'spectator', 0, 0);
                            SELECT SCOPE_IDENTITY() AS id;
                        `);
                    ticketTypeId = ttRes.recordset[0].id;
                }

                // 2c. Create Attendee (Required for Order Item)
                const attendeeRes = await new sql.Request(transaction)
                    .input('eid', sql.Int, eventId)
                    .input('pid', sql.Int, personId)
                    .input('ttid', sql.Int, ticketTypeId)
                    .query(`
                        INSERT INTO attendees (event_id, person_id, ticket_type_id, status, is_heavy_model_inspector, attending_dinner) 
                        VALUES (@eid, @pid, @ttid, 'Registered', 0, 0); 
                        SELECT SCOPE_IDENTITY() AS id;
                    `);
                const attendeeId = attendeeRes.recordset[0].id;

                // 3. Create 'Legacy' Order
                // Status: 'Pending' so it shows up as unpaid, but we use booking_source='Legacy' to identify it
                const orderRes = await new sql.Request(transaction)
                    .input('uid', sql.Int, userId)
                    .query("INSERT INTO orders (user_id, total_amount, payment_status, amount_paid, booking_source) VALUES (@uid, 0, 'Pending', 0, 'Legacy'); SELECT SCOPE_IDENTITY() AS id");
                const orderId = orderRes.recordset[0].id;

                // 4. Validate Campsite & Add Order Item
                const campRes = await new sql.Request(transaction)
                    .input('cid', sql.Int, campsiteId)
                    .query("SELECT price_per_night, site_number FROM campsites LEFT JOIN campgrounds ON campsites.campground_id = campgrounds.campground_id WHERE campsite_id = @cid");

                if (campRes.recordset.length === 0) throw new Error("Invalid campsite ID");

                // 4b. Check Availability - Ensure no conflicting bookings
                const availabilityCheck = await new sql.Request(transaction)
                    .input('cid', sql.Int, campsiteId)
                    .input('checkIn', sql.Date, checkIn)
                    .input('checkOut', sql.Date, checkOut)
                    .query(`
                        SELECT COUNT(*) as conflicts FROM campsite_bookings cb
                        JOIN order_items oi ON cb.order_item_id = oi.order_item_id
                        JOIN orders o ON oi.order_id = o.order_id
                        WHERE cb.campsite_id = @cid
                        AND o.payment_status != 'Cancelled'
                        AND cb.check_in_date < @checkOut
                        AND cb.check_out_date > @checkIn
                    `);

                if (availabilityCheck.recordset[0].conflicts > 0) {
                    await transaction.rollback();
                    return { status: 409, body: JSON.stringify({ error: "This site is already booked for the selected dates. Please choose different dates or a different site." }) };
                }

                const itemRes = await new sql.Request(transaction)
                    .input('oid', sql.Int, orderId)
                    .input('aid', sql.Int, attendeeId)
                    .input('itype', sql.VarChar, 'Campsite')
                    .input('refid', sql.Int, campsiteId)
                    .input('price', sql.Decimal(10, 2), 0)
                    .query(`
                        INSERT INTO order_items (order_id, attendee_id, item_type, item_reference_id, price_at_purchase, quantity) 
                        VALUES (@oid, @aid, @itype, @refid, @price, 1); 
                        SELECT SCOPE_IDENTITY() AS id
                    `);

                const orderItemId = itemRes.recordset[0].id;

                // 5. Create Booking using provided dates
                await new sql.Request(transaction)
                    .input('cid', sql.Int, campsiteId)
                    .input('oiid', sql.Int, orderItemId)
                    .input('in', sql.Date, checkIn)
                    .input('out', sql.Date, checkOut)
                    .query(`
                        INSERT INTO campsite_bookings (campsite_id, order_item_id, check_in_date, check_out_date, number_of_adults, number_of_children) 
                        VALUES (@cid, @oiid, @in, @out, 1, 0)
                    `);

                await transaction.commit();

                // 6. Send Email
                if (isNewUser) {
                    const orgSettings = await pool.request().query("SELECT TOP 1 organization_name FROM organization_settings");
                    const orgName = orgSettings.recordset.length > 0 ? orgSettings.recordset[0].organization_name : 'Aeromodelling';
                    const siteUrl = request.headers.get('origin');

                    // We need campsite name
                    const campName = campRes.recordset[0].site_number || `Site ID ${campsiteId}`;

                    await sendLegacyWelcomeEmail(email, verificationToken, firstName, orgName, siteUrl, campName);
                }

                return { status: 201, body: JSON.stringify({ message: "Legacy booking created." }) };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log(`Error in createLegacyBooking: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
