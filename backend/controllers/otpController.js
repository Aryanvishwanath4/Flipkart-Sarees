const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const User = require('../models/userModel');
const sendToken = require('../utils/sendToken');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

// In-memory OTP storage
// In production, use Redis with expiry
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
        // You can comment this out to test real SMS/Email even in dev
         // return '123456'; 
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP
 * Channel: 'sms', 'email', 'whatsapp'
 * Identifier: Phone Number or Email Address
 */
exports.sendOTP = asyncErrorHandler(async (req, res, next) => {
    
    // Support both 'phone' and 'email' based on channel
    const { phone, email, channel } = req.body; // channel: 'sms' | 'email' | 'whatsapp'
    
    const selectedChannel = channel || 'sms'; // Default to sms
    let identifier = '';

    if (selectedChannel === 'email') {
        if (!email) return next(new ErrorHandler("Please provide an email address", 400));
        identifier = email;
    } else {
        if (!phone || phone.length !== 10) return next(new ErrorHandler("Please provide a valid 10-digit phone number", 400));
        identifier = phone;
    }

    console.log(`Processing OTP Request for [${identifier}] via [${selectedChannel}]`);

    // Existing Rate Limiting (Disabled/Relaxed for now)
    /*
    const limit = 5;
    const timeWindow = 3600000; // 1 hr
    const existingEntry = otpStore.get(identifier);
    if (existingEntry && existingEntry.attempts >= limit) {
         // ...
    }
    */
   
    const existingEntry = otpStore.get(identifier); // Preserve old attempts if needed

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Store OTP
    otpStore.set(identifier, {
        otp,
        expiresAt,
        verified: false,
        channel: selectedChannel
    });

    try {
        if (selectedChannel === 'sms') {
            // Fast2SMS Call Disabled by User Request (too costly)
            console.log(`[SMS Mock] Fast2SMS Disabled. OTP for ${identifier}: ${otp}`);
            /*
            if (process.env.FAST2SMS_API_KEY) {
               // ...
            }
            */
        } else if (selectedChannel === 'email') {
            // Email Logic (Non-blocking)
            sendEmail({
                email: identifier,
                subject: 'Flipkart Login OTP',
                message: `<p>Your OTP for login is <b>${otp}</b>. Valid for 5 minutes.</p>`
            }).then(() => {
                console.log(`[Email] OTP sent to ${identifier}`);
            }).catch((err) => {
                console.error(`[Email Error] Failed to send to ${identifier}:`, err.message);
            });

        } else if (selectedChannel === 'whatsapp') {
            const { getWhatsAppClient, isClientReady } = require('../utils/whatsappClient');
            const client = getWhatsAppClient();

            if (client && isClientReady()) {
                // Formatting for India numbers (91)
                const chatId = `91${identifier}@c.us`; 
                client.sendMessage(chatId, `Your OTP for Aishwarya Silks is *${otp}*. Valid for 5 minutes.`)
                .then(() => {
                    console.log(`[WhatsApp] OTP sent to ${identifier}`);
                })
                .catch((err) => {
                    console.error(`[WhatsApp Error] Failed to send to ${identifier}:`, err.message);
                });
            } else {
                const status = !client ? "Not Initialized" : "Waiting for READY";
                console.log(`[WhatsApp Status: ${status}] OTP for ${identifier}: ${otp} (Sending Mock success for demo)`);
            }
        }

    } catch (error) {
        console.error("OTP Send Error:", error.message);
        // Continue to return success with Demo OTP in dev, or fail in prod?
        // For DX, we return success but include the error message in console.
    }

    res.status(200).json({
        success: true,
        message: `OTP sent to ${identifier} via ${selectedChannel}`,
        channel: selectedChannel,
        // Always return OTP in Dev mode for ease
        ...(process.env.NODE_ENV === 'development' && { demoOtp: otp })
    });
});

// Verify OTP
exports.verifyOTP = asyncErrorHandler(async (req, res, next) => {
    // Identifier can be phone OR email
    const { phone, email, otp } = req.body;
    const identifier = phone || email;

    if (!identifier || !otp) {
        return next(new ErrorHandler("Identifier and OTP are required", 400));
    }

    const storedData = otpStore.get(identifier);

    if (!storedData) {
        return next(new ErrorHandler("OTP not found or expired. Please request a new one.", 400));
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(identifier);
        return next(new ErrorHandler("OTP has expired.", 400));
    }

    if (storedData.otp !== otp) {
        return next(new ErrorHandler("Invalid OTP", 400));
    }

    // Mark as verified
    storedData.verified = true;
    otpStore.set(identifier, storedData);

    // Check if user exists
    // Dynamic query: search by phone OR email depending on what was provided
    const query = phone ? { phone } : { email };
    const user = await User.findOne(query);

    if (user) {
        // Log in the user
        sendToken(user, 200, res);
    } else {
        // Return verified status so frontend can redirect to signup
        res.status(200).json({
            success: true,
            message: "OTP Verified",
            exists: false,
            identifier, // send back the verified identifier
            isEmail: !!email
        });
    }
});

// Helper
exports.isVerified = (identifier) => {
    const data = otpStore.get(identifier);
    return data?.verified === true && Date.now() < data.expiresAt + 30 * 60 * 1000;
};

exports.otpStore = otpStore;
