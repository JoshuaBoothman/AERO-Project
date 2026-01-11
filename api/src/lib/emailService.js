const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

/**
 * Sends a verification email to the user.
 * @param {string} email - The user's email address.
 * @param {string} token - The verification token.
 * @param {string} firstName - The user's first name.
 */
async function sendVerificationEmail(email, token, firstName) {
    const verificationLink = `${SITE_URL}/verify-email?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: 'Aeromodelling <onboarding@resend.dev>', // Update this if you have a verified domain
            to: [email],
            subject: 'Verify your email address',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome, ${firstName}!</h2>
                    <p>Thank you for registering with Aeromodelling. Please click the button below to verify your email address and activate your account.</p>
                    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
                    <p>Or click this link: <a href="${verificationLink}">${verificationLink}</a></p>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `
        });

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
