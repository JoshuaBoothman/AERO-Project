const { Resend } = require('resend');



/**
 * Sends a verification email to the user.
 * @param {string} email - The user's email address.
 * @param {string} token - The verification token.
 * @param {string} firstName - The user's first name.
 * @param {string} organizationName - The organization name (e.g. from DB).
 * @param {string} siteUrl - The frontend URL (e.g. from Origin header).
 */
async function sendVerificationEmail(email, token, firstName, organizationName, siteUrl) {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing. Cannot send verification email.');
        return { success: false, error: 'Misconfigured: Missing RESEND_API_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Fallbacks
    const orgName = organizationName || 'Aeromodelling';
    const baseUrl = siteUrl || process.env.SITE_URL || 'http://localhost:5173';

    // Construct Link
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: `${orgName} <registrations@meandervalleywebdesign.com.au>`,
            to: [email],
            subject: 'Verify your email address',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome, ${firstName}!</h2>
                    <p>Thank you for registering with ${orgName}. Please click the button below to verify your email address and activate your account.</p>
                    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
                    <p>Or click this link: <a href="${verificationLink}">${verificationLink}</a></p>
                    <p>This link will expire in 24 hours.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message, please do not reply directly to this email.</p>
                </div>
            `
        });

        if (data.error) {
            console.error('Resend API returned error:', data.error);
            return { success: false, error: data.error };
        }

        console.log('Verification email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error };
    }
}


/**
 * Sends a public registration confirmation email.
 * @param {string} email - Recipient email.
 * @param {string} firstName - First Name.
 * @param {string} ticketCode - Unique Ticket Code.
 * @param {string} eventDate - Date of event (formatted).
 * @param {number} adults - Count.
 * @param {number} children - Count.
 * @param {string} eventName - Event Name.
 */
async function sendPublicRegistrationEmail(email, firstName, ticketCode, eventDate, adults, children, eventName) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing.');
        return { success: false, error: 'Misconfigured: Missing RESEND_API_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const orgName = 'Aeromodelling'; // Could pass this in if needed

    try {
        const data = await resend.emails.send({
            from: `${orgName} <registrations@meandervalleywebdesign.com.au>`,
            to: [email],
            subject: `Air Show Registration Confirmed - ${ticketCode}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #007bff;">You're going to the Air Show!</h2>
                    <p>Hi ${firstName},</p>
                    <p>This email confirms your registration for the <strong>${eventName} (Air Show)</strong> on <strong>${eventDate}</strong>.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #333;">Your Ticket Code: <span style="font-family: monospace; font-size: 1.2em; color: #000;">${ticketCode}</span></h3>
                        <p style="margin-bottom: 5px;"><strong>Adults:</strong> ${adults}</p>
                        <p style="margin-bottom: 0;"><strong>Children:</strong> ${children}</p>
                    </div>

                    <p>Please show this code at the gate for entry.</p>
                    <p>We look forward to seeing you there!</p>
                </div>
            `
        });

        if (data.error) {
            console.error('Resend API returned error:', data.error);
            return { success: false, error: data.error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending public registration email:', error);
        return { success: false, error };
    }
}

/**
 * Sends a password reset email.
 * @param {string} email - The user's email address.
 * @param {string} token - The password reset token.
 * @param {string} firstName - The user's first name.
 * @param {string} siteUrl - The frontend URL.
 */
async function sendPasswordResetEmail(email, token, firstName, siteUrl) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing. Cannot send password reset email.');
        return { success: false, error: 'Misconfigured: Missing RESEND_API_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = siteUrl || process.env.SITE_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    const orgName = 'Aeromodelling';

    try {
        const data = await resend.emails.send({
            from: `${orgName} <registrations@meandervalleywebdesign.com.au>`,
            to: [email],
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${firstName},</p>
                    <p>We received a request to reset your password. Click the button below to set a new password.</p>
                    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
                    <p>Or click this link: <a href="${resetLink}">${resetLink}</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
                </div>
            `
        });

        if (data.error) {
            console.error('Resend API returned error:', data.error);
            return { success: false, error: data.error };
        }

        console.log('Password reset email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error };
    }
}

/**
 * Sends a legacy welcome email (for imported bookings).
 * @param {string} email - The user's email address.
 * @param {string} token - The verification/claim token.
 * @param {string} firstName - The user's first name.
 * @param {string} organizationName - Organization name.
 * @param {string} siteUrl - Frontend URL.
 * @param {string} campsiteName - Booked campsite name.
 */
async function sendLegacyWelcomeEmail(email, token, firstName, organizationName, siteUrl, campsiteName) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing.');
        return { success: false, error: 'Misconfigured: Missing RESEND_API_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const orgName = organizationName || 'Aeromodelling';
    const baseUrl = siteUrl || process.env.SITE_URL || 'http://localhost:5173';

    // Link points to 'claim-account' or just standard verify? 
    // The authRegister logic works via standard registration form.
    // So the email should tell them to "Complete your account setup" or "Register to claim".
    // But we generated a verification token.
    // If they click verify link, it verifies the *placeholder* account.
    // But they need to *set a password*.
    // The 'legacy' flow in authRegister.js handles the "Claim" via the register endpoint.
    // So we should direct them to the **Registration Page** where they enter their email.
    // Alternatively, a special link `register?email=...&token=...` could pre-fill.
    // For now, let's just point them to the site and tell them to Register with THIS email.
    // Wait, the `createLegacyBooking.js` generated a `verificationToken` and passed it here.
    // If they verify via `verify-email?token=...`, they verify the account but still have no password?
    // The user needs to "Register" (which claims the account and sets password).
    // So the link should probably be to the Registration page.

    const registrationLink = `${baseUrl}/register?email=${encodeURIComponent(email)}`;

    try {
        const data = await resend.emails.send({
            from: `${orgName} <registrations@meandervalleywebdesign.com.au>`,
            to: [email],
            subject: 'Complete your Campsite Booking',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome back, ${firstName}!</h2>
                    <p>A campsite booking (<strong>${campsiteName}</strong>) has been reserved for you for the upcoming event.</p>
                    
                    <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-left: 4px solid #ffeeba; margin: 20px 0;">
                        <strong>Important Notice:</strong> 
                        The website will not be live for new registrations until <strong>Thursday 19th February at 4:00 PM (QLD Time)</strong>. 
                        Please do not attempt to claim your account until that time.
                    </div>

                    <p>To confirm this booking and pay, you need to active your account.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <strong>Action Required:</strong> Please register an account using this email address: <strong>${email}</strong>
                    </div>
                    <a href="${registrationLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: bold;">Create Account to Claim Booking</a>
                    <p>Or visit: <a href="${registrationLink}">${registrationLink}</a></p>
                    <p>Once registered, you will find your campsite reservation in your cart, ready for checkout.</p>
                </div>
            `
        });

        if (data.error) {
            console.error('Resend API error:', data.error);
            return { success: false, error: data.error };
        }

        console.log('Legacy welcome email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending legacy email:', error);
        return { success: false, error };
    }
}

module.exports = {
    sendVerificationEmail,
    sendPublicRegistrationEmail,
    sendPasswordResetEmail,
    sendLegacyWelcomeEmail,
    sendOrderConfirmationEmail
};

/**
 * Sends an order confirmation email.
 * @param {string} email - User's email.
 * @param {string} firstName - User's first name.
 * @param {string} invoiceNumber - The invoice number (e.g. INV-2024-123).
 * @param {number} totalAmount - Total amount of the order.
 * @param {object} bankDetails - { accountName, bsb, accountNumber }
 */
async function sendOrderConfirmationEmail(email, firstName, invoiceNumber, totalAmount, bankDetails) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing.');
        return { success: false, error: 'Misconfigured: Missing RESEND_API_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const orgName = 'Aeromodelling'; // Or fetch from somewhere if dynamic

    const bankHtml = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Bank Transfer Details</h3>
            <p style="margin: 5px 0;"><strong>Account Name:</strong> ${bankDetails.accountName}</p>
            <p style="margin: 5px 0;"><strong>BSB:</strong> ${bankDetails.bsb}</p>
            <p style="margin: 5px 0;"><strong>Account Number:</strong> ${bankDetails.accountNumber}</p>
            <p style="margin: 5px 0;"><strong>Reference:</strong> ${invoiceNumber}</p>
            <p style="color: #d9534f; font-size: 0.9em; margin-top: 10px;">
                <strong>Note:</strong> If you have already paid via Credit Card, please disregard these payment instructions.
            </p>
        </div>
    `;

    try {
        const data = await resend.emails.send({
            from: `${orgName} <registrations@meandervalleywebdesign.com.au>`,
            to: [email],
            subject: `Order Confirmation: ${invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #28a745;">Order Confirmed!</h2>
                    <p>Hi ${firstName || 'There'},</p>
                    <p>Thank you for your order. Here is your order summary:</p>
                    
                    <div style="margin: 20px 0; font-size: 1.1em;">
                        <p><strong>Order / Invoice:</strong> ${invoiceNumber}</p>
                        <p><strong>Total Amount:</strong> $${Number(totalAmount).toFixed(2)}</p>
                    </div>

                    ${bankHtml}

                    <p>A receipt/invoice is attached to your account dashboard.</p>
                    <p>Thanks,<br/>${orgName} Team</p>
                </div>
            `
        });

        if (data.error) {
            console.error('Resend API error:', data.error);
            return { success: false, error: data.error };
        }

        console.log(`Order confirmation email sent to ${email} for ${invoiceNumber}`);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return { success: false, error };
    }
}
