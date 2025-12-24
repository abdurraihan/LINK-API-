import sgMail from "@sendgrid/mail";
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;
if (!apiKey || !fromEmail) {
    throw new Error("SendGrid env vars missing");
}
sgMail.setApiKey(apiKey);
export const sendOTPEmail = async (email, otp) => {
    try {
        const response = await sgMail.send({
            to: email,
            from: fromEmail,
            subject: "Verify your email",
            html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`,
        });
        console.log("SendGrid success:", response[0].statusCode);
    }
    catch (error) {
        console.error("SendGrid error:", error?.response?.body || error);
        throw error;
    }
};
