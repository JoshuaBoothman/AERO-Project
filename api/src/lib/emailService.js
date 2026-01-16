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

module.exports = {
    sendVerificationEmail
};
