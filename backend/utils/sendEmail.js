const nodeMailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodeMailer.createTransport({
        service: process.env.SMTP_SERVICE, // 'gmail'
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        secure: true, // Use SSL/TLS for port 465
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds
        logger: false, // Turn off noisy logs in production unless needed
        debug: false
    });

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;