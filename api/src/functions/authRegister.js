const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const { query, sql } = require('../lib/db');

app.http('authRegister', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email, password, firstName, lastName, ausNumber } = await request.json();

            // 0. Check Registration Lock
            try {
                const settingsRes = await query("SELECT TOP 1 registration_lock_until FROM organization_settings");
                if (settingsRes.length > 0 && settingsRes[0].registration_lock_until) {
                    const lockDate = new Date(settingsRes[0].registration_lock_until);
                    const now = new Date();
                    if (now < lockDate) {
                        return {
                            status: 403,
                            body: "Registrations are closed until Thursday 19th Feb at 4pm QLD time."
                        };
                    }
                }
            } catch (err) {
                context.log(`Error checking registration lock: ${err.message}`);
                // Proceed if check fails (fail open? or fail closed? Fail open is better for UX if DB is acting up, but riskier. Let's fail open but log.)
            }

            if (!email || !password || !firstName || !lastName || !ausNumber) {
                return { status: 400, body: "Missing required fields (including AUS Number)." };
            }

            // 1. Check if user exists
            const checkQuery = "SELECT user_id, is_email_verified, is_legacy_import FROM users WHERE email = @email";
            const existingUserRes = await query(checkQuery, [
                { name: 'email', type: sql.NVarChar, value: email }
            ]);

            let legacyUserId = null;

            if (existingUserRes.length > 0) {
                const user = existingUserRes[0];
                // Check if this is a Legacy Import account that hasn't been claimed/verified yet
                if (user.is_legacy_import && user.is_email_verified === false) {
                    legacyUserId = user.user_id;
                    // Proceed to allow "registration" (which is actually claiming the account)
                } else {
                    return { status: 409, body: "Email already registered." };
                }
            }

            // 2. Hash Password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // 3. Generate Verification Token
            const crypto = require('crypto');
            const { sendVerificationEmail } = require('../lib/emailService');

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const tokenExpires = new Date();
            tokenExpires.setHours(tokenExpires.getHours() + 24); // Expires in 24 hours

            // 4. Insert or Update User
            if (legacyUserId) {
                const updateQuery = `
                    UPDATE users SET 
                        password_hash = @hash, 
                        first_name = @first, 
                        last_name = @last, 
                        aus_number = @aus, 
                        verification_token = @token, 
                        verification_token_expires = @expires
                    WHERE user_id = @uid
                `;
                await query(updateQuery, [
                    { name: 'uid', type: sql.Int, value: legacyUserId },
                    { name: 'hash', type: sql.NVarChar, value: passwordHash },
                    { name: 'first', type: sql.NVarChar, value: firstName },
                    { name: 'last', type: sql.NVarChar, value: lastName },
                    { name: 'aus', type: sql.NVarChar, value: ausNumber },
                    { name: 'token', type: sql.NVarChar, value: verificationToken },
                    { name: 'expires', type: sql.DateTime, value: tokenExpires }
                ]);
            } else {
                const insertQuery = `
                    INSERT INTO users (email, password_hash, first_name, last_name, aus_number, is_email_verified, verification_token, verification_token_expires)
                    VALUES (@email, @hash, @first, @last, @aus, 0, @token, @expires)
                `;

                await query(insertQuery, [
                    { name: 'email', type: sql.NVarChar, value: email },
                    { name: 'hash', type: sql.NVarChar, value: passwordHash },
                    { name: 'first', type: sql.NVarChar, value: firstName },
                    { name: 'last', type: sql.NVarChar, value: lastName },
                    { name: 'aus', type: sql.NVarChar, value: ausNumber },
                    { name: 'token', type: sql.NVarChar, value: verificationToken },
                    { name: 'expires', type: sql.DateTime, value: tokenExpires }
                ]);
            }


            // 5. Send Verification Email
            // Fetch Organization Name and Origin URL dynamically
            let orgName = 'Aeromodelling';
            let siteUrl = request.headers.get('origin'); // Dynamic frontend URL

            try {
                const orgSettings = await query("SELECT TOP 1 organization_name FROM organization_settings");
                if (orgSettings.length > 0 && orgSettings[0].organization_name) {
                    orgName = orgSettings[0].organization_name;
                }
            } catch (ignore) {
                context.warn("Could not fetch organization name for email, using default.");
            }

            const emailResult = await sendVerificationEmail(email, verificationToken, firstName, orgName, siteUrl);

            if (!emailResult.success) {
                // Determine if we should delete the user or just warn
                // For now, let's keep the user but return a specific error so frontend can handle it
                // Or clean up? Best practice: if email fails, user can't verify, so maybe rollback?
                // Decided: Return error code but keep user? No, they can't verify.
                // Simpler: Return 500 but with specific message.
                // Ideally we would delete the user here to allow retry.

                // Let's delete the user to allow retry
                // WARNING: If legacy user, maybe don't delete? 
                // If legacy user, we should probably revert the update? 
                // But simpler: just delete. If admin imported, they can re-import if things break. 
                // Or better: Don't delete legacy user, just fail.

                if (!legacyUserId) {
                    const deleteQuery = "DELETE FROM users WHERE email = @email";
                    await query(deleteQuery, [
                        { name: 'email', type: sql.NVarChar, value: email }
                    ]);
                }

                return {
                    status: 500,
                    body: `User created but email failed to send: ${JSON.stringify(emailResult.error)}. Please try again.`
                };
            }

            return { status: 201, body: JSON.stringify({ message: "User created successfully" }) };

        } catch (error) {
            context.log(`Error in authRegister: ${error.message}`);
            // If JSON parsing fails
            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                return { status: 400, body: "Invalid JSON body" };
            }
            return { status: 500, body: "Internal Server Error" };
        }
    }
});