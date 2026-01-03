const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/errorHandler');
const { isPhoneVerified } = require('./otpController');

// Razorpay Test Key (public)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

// Create Razorpay Order (simulated for demo)
exports.createRazorpayOrder = asyncErrorHandler(async (req, res, next) => {
    const { amount, phone } = req.body;

    if (!amount || amount <= 0) {
        return next(new ErrorHandler("Invalid amount", 400));
    }

    // Verify phone is authenticated (optional for demo)
    if (phone && !isPhoneVerified(phone)) {
        console.log(`[DEMO] Phone ${phone} not verified, allowing anyway for testing`);
    }

    // In production, create real Razorpay order:
    // const razorpay = new Razorpay({ key_id, key_secret });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR' });

    // For demo, generate a fake order ID
    const orderId = 'order_demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    res.status(200).json({
        success: true,
        order: {
            id: orderId,
            amount: amount * 100, // Razorpay expects paise
            currency: 'INR',
        },
        key: RAZORPAY_KEY_ID,
    });
});

// Verify Razorpay Payment (simulated for demo)
exports.verifyRazorpayPayment = asyncErrorHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // In production, verify signature using crypto:
    // const hmac = crypto.createHmac('sha256', key_secret);
    // hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    // const generated_signature = hmac.digest('hex');
    // if (generated_signature !== razorpay_signature) throw error;

    // For demo, accept any payment
    console.log(`[DEMO PAYMENT] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);

    res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentInfo: {
            id: razorpay_payment_id || 'pay_demo_' + Date.now(),
            orderId: razorpay_order_id,
            status: 'success'
        }
    });
});

// Create Guest Order
exports.createGuestOrder = asyncErrorHandler(async (req, res, next) => {
    console.log("Order placement initiated (Guest)");
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        guestInfo // { name, phone, email }
    } = req.body;
    console.log("Guest Info received:", guestInfo);

    // Validate required fields
    if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
        return next(new ErrorHandler("Missing required order information", 400));
    }

    if (!guestInfo || !guestInfo.phone) {
        return next(new ErrorHandler("Guest phone number is required", 400));
    }

    // For guest orders, we don't require user ObjectId
    // Create order with guest info embedded
    // Normalize phone number to last 10 digits
    const normalizePhone = (p) => {
        const cleaned = p.toString().replace(/\D/g, '');
        return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
    };
    
    // Actually, simple number conversion is what we used before, let's stick to last 10 digits logic
    const phoneNoNum = parseInt(guestInfo.phone.toString().replace(/\D/g, '').slice(-10));

    const order = await Order.create({
        shippingInfo: {
            ...shippingInfo,
            phoneNo: phoneNoNum,
        },
        orderItems,
        paymentInfo: {
            id: paymentInfo.id || 'demo_' + Date.now(),
            status: paymentInfo.status || 'Paid',
        },
        totalPrice,
        paidAt: Date.now(),
        user: req.user?._id, // Associate if user is logged in
        guestInfo: {
            name: guestInfo.name,
            phone: guestInfo.phone,
            email: guestInfo.email || '',
        },
    });

    // Send order confirmation email if guest provided an email
    if (guestInfo.email) {
        const itemsHtml = orderItems.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                    ${item.name}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${item.price.toLocaleString()}</td>
            </tr>
        `).join('');

        const emailMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${process.env.LOGO_URL}" alt="Aishwarya Silks" style="width: 150px;">
                </div>
                <h2 style="color: #2874f0; text-align: center;">Order Confirmed!</h2>
                <p>Hi ${guestInfo.name},</p>
                <p>Thank you for shopping with Aishwarya Silks. Your guest order has been placed successfully and is being processed.</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Summary</h3>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Total Amount:</strong> ₹${totalPrice.toLocaleString()}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f2f2f2;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: left;">Qty</th>
                            <th style="padding: 10px; text-align: left;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="margin-bottom: 20px;">
                    <h3>Shipping Address</h3>
                    <p>${shippingInfo.name}<br>
                    ${shippingInfo.address}, ${shippingInfo.city}<br>
                    ${shippingInfo.state} - ${shippingInfo.pincode}<br>
                    Phone: ${shippingInfo.phoneNo}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 14px; color: #555;">Since you checked out as a guest, you can track your order using your phone number on our site.</p>
                    <a href="${process.env.FRONTEND_URL}/orders" style="background: #fb641b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
                </div>
                
                <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #888; text-align: center;">If you have any questions, contact us at support@aishwaryasilks.com</p>
            </div>
        `;

        console.log(`Attempting to send guest order confirmation email to: ${guestInfo.email}`);
        try {
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                email: guestInfo.email,
                subject: `Order Confirmed - Aishwarya Silks (#${order._id.toString().slice(-6).toUpperCase()})`,
                message: emailMessage
            });
            console.log("Guest order confirmation email sent successfully");
        } catch (error) {
            console.error("Guest Order Email Error:", error.message);
        }
    }

    res.status(201).json({
        success: true,
        order,
        message: "Order placed successfully!",
    });
});

// Get Order by Phone (for guest order tracking)
exports.getOrdersByPhone = asyncErrorHandler(async (req, res, next) => {
    const { phone } = req.params;

    if (!phone) {
        return next(new ErrorHandler("Phone number is required", 400));
    }

    // Verify phone via OTP before showing orders
    if (!isPhoneVerified(phone)) {
        return next(new ErrorHandler("Please verify your phone number first", 401));
    }

    const orders = await Order.find({ 'shippingInfo.phoneNo': parseInt(phone) });

    res.status(200).json({
        success: true,
        orders,
    });
});

// Get Razorpay Key (for frontend)
exports.getRazorpayKey = asyncErrorHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        key: RAZORPAY_KEY_ID,
    });
});
