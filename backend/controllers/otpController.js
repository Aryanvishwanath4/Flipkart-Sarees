const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');

// In-memory OTP storage (for demo purposes)
// In production, use Redis with expiry
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
    // Demo mode: always return 123456
    if (process.env.NODE_ENV === 'development' || !process.env.MSG91_AUTH_KEY) {
        return '123456';
    }
    // Production: generate random 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
exports.sendOTP = asyncErrorHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
        return next(new ErrorHandler("Please provide a valid 10-digit phone number", 400));
    }

    // Rate limiting check (max 3 OTPs per phone in 1 hour)
    const existingEntry = otpStore.get(phone);
    if (existingEntry && existingEntry.attempts >= 3) {
        const timeDiff = Date.now() - existingEntry.firstAttempt;
        if (timeDiff < 3600000) { // 1 hour
            return next(new ErrorHandler("Too many OTP requests. Try again later.", 429));
        }
        // Reset if more than 1 hour
        otpStore.delete(phone);
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    const currentAttempts = existingEntry?.attempts || 0;
    otpStore.set(phone, {
        otp,
        expiresAt,
        attempts: currentAttempts + 1,
        firstAttempt: existingEntry?.firstAttempt || Date.now(),
        verified: false
    });

    // In production, send SMS via MSG91/Twilio here
    // For now, just log it (demo mode)
    console.log(`[DEMO OTP] Phone: ${phone}, OTP: ${otp}`);

    res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        // Only show OTP in development
        ...(process.env.NODE_ENV === 'development' && { demoOtp: otp })
    });
});

// Verify OTP
exports.verifyOTP = asyncErrorHandler(async (req, res, next) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return next(new ErrorHandler("Phone and OTP are required", 400));
    }

    const storedData = otpStore.get(phone);

    if (!storedData) {
        return next(new ErrorHandler("OTP not found. Please request a new one.", 400));
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(phone);
        return next(new ErrorHandler("OTP has expired. Please request a new one.", 400));
    }

    if (storedData.otp !== otp) {
        return next(new ErrorHandler("Invalid OTP", 400));
    }

    // Mark as verified
    storedData.verified = true;
    otpStore.set(phone, storedData);

    // Generate a simple session token (for demo)
    const sessionToken = Buffer.from(`${phone}:${Date.now()}`).toString('base64');

    res.status(200).json({
        success: true,
        message: "Phone verified successfully",
        sessionToken,
        phone
    });
});

// Check if phone is verified (middleware helper)
exports.isPhoneVerified = (phone) => {
    const data = otpStore.get(phone);
    return data?.verified === true && Date.now() < data.expiresAt + 30 * 60 * 1000; // 30 min session
};

// Export for use in other controllers
exports.otpStore = otpStore;
