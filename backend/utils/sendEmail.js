const axios = require('axios');

const sendEmail = async (options) => {
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
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        });

        console.log(`Email sent via Brevo API: ${response.data.messageId}`);
    } catch (error) {
        console.error("Brevo API Email Error:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = sendEmail;