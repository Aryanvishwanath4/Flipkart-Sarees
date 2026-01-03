const axios = require('axios');

const sendEmail = async (options) => {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        console.error("CRITICAL: BREVO_API_KEY is missing from environment variables!");
        throw new Error("Email configuration error: API Key missing");
    }

    console.log(`Sending email to ${options.email} via Brevo API... (Key exists: ${apiKey.slice(0, 8)}...)`);

    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { 
                name: "Aishwarya Silks", 
                email: process.env.SMTP_MAIL || "aishwaryasilks36@gmail.com" 
            },
            to: [{ email: options.email }],
            subject: options.subject,
            htmlContent: options.message,
        }, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`Email sent successfully! ID: ${response.data.messageId}`);
    } catch (error) {
        console.error("Brevo API Detailed Error:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = sendEmail;