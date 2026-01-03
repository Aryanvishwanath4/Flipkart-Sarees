const User = require('../models/userModel');
const Order = require('../models/orderModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const cloudinary = require('cloudinary');

// Register User
exports.registerUser = asyncErrorHandler(async (req, res, next) => {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    });

    const { name, email, gender, password } = req.body;

    const user = await User.create({
        name, 
        email,
        gender,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    sendToken(user, 201, res);
});

// Login User
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 400));
    }

    const user = await User.findOne({ email}).select("+password");

    if(!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 201, res);
});

// Logout User
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// Get User Details
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
    
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
});

// Forgot Password
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    
    const user = await User.findOne({email: req.body.email});

    if(!user) {
        return next(new ErrorHandler("User Not Found", 404));
    }

    const resetToken = await user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
    const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

    // const message = `Your password reset token is : \n\n ${resetPasswordUrl}`;

    try {
        await sendEmail({
            email: user.email,
            templateId: process.env.SENDGRID_RESET_TEMPLATEID,
            data: {
                reset_url: resetPasswordUrl
            }
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500))
    }
});

// Reset Password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {

    // create hash token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({ 
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if(!user) {
        return next(new ErrorHandler("Invalid reset password token", 404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

// Update Password
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched) {
        return next(new ErrorHandler("Old Password is Invalid", 400));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 201, res);
});

// Update User Profile
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    if(req.body.avatar !== "") {
        const user = await User.findById(req.user.id);

        const imageId = user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    }

    await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: true,
    });

    res.status(200).json({
        success: true,
    });
});

// ADMIN DASHBOARD

// Get All Users --ADMIN
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {

    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});

// Get Single User Details --ADMIN
exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// Update User Role --ADMIN
exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        role: req.body.role,
    }

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

// Delete Role --ADMIN
exports.deleteUser = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 404));
    }

    await user.remove();

    res.status(200).json({
        success: true
    });
});

// OTP Login - Login using phone and OTP
exports.otpLogin = asyncErrorHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return next(new ErrorHandler("Phone number is required", 400));
    }

    // Find user by phone
    let user = await User.findOne({ phone });

    if (!user) {
        return next(new ErrorHandler("No account found with this phone number", 404));
    }

    // OTP should already be verified before this call
    sendToken(user, 200, res);
});

// Create Account from Guest Order
exports.createAccountFromGuest = asyncErrorHandler(async (req, res, next) => {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Name, email and password are required", 400));
    }

    // Check if user with email or phone already exists
    const existingUser = await User.findOne({
        $or: [{ email }, ...(phone ? [{ phone }] : [])]
    });

    if (existingUser) {
        return next(new ErrorHandler("User with this email or phone already exists", 400));
    }

    // Create user with address if provided
    const userData = {
        name,
        email,
        phone: phone || undefined,
        gender: "other", // Default, can be updated later
        password,
        avatar: {
            public_id: "default_avatar",
            url: "https://res.cloudinary.com/demo/image/upload/v1/avatars/default.png"
        }
    };

    // Add address if provided
    if (address) {
        userData.addresses = [{
            ...address,
            isDefault: true
        }];
    }

    const user = await User.create(userData);

    // Link guest orders with this phone number to the new user
    if (phone) {
        const cleanPhone = phone.toString().replace(/\D/g, '');
        const tenDigit = parseInt(cleanPhone.slice(-10));
        const with91 = parseInt("91" + cleanPhone.slice(-10));

        await Order.updateMany(
            { 
                "shippingInfo.phoneNo": { $in: [tenDigit, with91] }, 
                user: { $exists: false } 
            },
            { $set: { user: user._id } }
        );
    }

    sendToken(user, 201, res);
});

// Check if phone has an account
exports.checkPhoneAccount = asyncErrorHandler(async (req, res, next) => {
    const { phone } = req.params;

    const user = await User.findOne({ phone });

    res.status(200).json({
        success: true,
        hasAccount: !!user,
        user: user ? { name: user.name, email: user.email } : null
    });
});

// Add/Update Address
exports.addAddress = asyncErrorHandler(async (req, res, next) => {
    const { name, address, city, state, pincode, phone, isDefault } = req.body;

    const user = await User.findById(req.user.id);

    const newAddress = {
        name,
        address,
        city,
        state,
        pincode,
        phone,
        isDefault: isDefault || false
    };

    // If this is set as default, unset other defaults
    if (isDefault) {
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});

// Get User Addresses
exports.getAddresses = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        addresses: user.addresses || []
    });
});

// Delete Address
exports.deleteAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
        addr => addr._id.toString() !== req.params.id
    );

    await user.save();

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});