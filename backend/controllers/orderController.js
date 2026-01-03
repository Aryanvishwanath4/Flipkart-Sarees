const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
    console.log("Order placement initiated (Authenticated)");
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
    } = req.body;

    const orderExist = await Order.findOne({ paymentInfo });

    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

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
            <p>Hi ${req.user.name},</p>
            <p>Thank you for shopping with Aishwarya Silks. Your order has been placed successfully and is being processed.</p>
            
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
                <a href="${process.env.FRONTEND_URL}/order/${order._id}" style="background: #fb641b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
            </div>
            
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888; text-align: center;">If you have any questions, contact us at support@aishwaryasilks.com</p>
        </div>
    `;

    console.log(`Attempting to send order confirmation email to: ${req.user.email}`);
    // Non-blocking email sending
    sendEmail({
        email: req.user.email,
        subject: `Order Confirmed - Aishwarya Silks (#${order._id.toString().slice(-6).toUpperCase()})`,
        message: emailMessage
    }).then(() => {
        console.log("Order confirmation email sent successfully");
    }).catch((error) => {
        console.error("Order Email Error:", error.message);
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// Get Single Order Details
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});


// Get Logged In User Orders
exports.myOrders = asyncErrorHandler(async (req, res, next) => {

    const query = {
        $or: [
            { user: req.user._id },
        ]
    };

    if (req.user.phone) {
        const cleanPhone = req.user.phone.toString().replace(/\D/g, '');
        const tenDigit = cleanPhone.slice(-10);
        
        query.$or.push({ "shippingInfo.phoneNo": parseInt(tenDigit) });
        query.$or.push({ "shippingInfo.phoneNo": parseInt("91" + tenDigit) });
        query.$or.push({ "guestInfo.phone": tenDigit });
        query.$or.push({ "guestInfo.phone": "91" + tenDigit });
        query.$or.push({ "guestInfo.phone": "+91" + tenDigit });
    }

    if (req.user.email) {
        query.$or.push({ "guestInfo.email": req.user.email });
    }

    const orders = await Order.find(query);

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


// Get All Orders ---ADMIN
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {

    const orders = await Order.find();

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        orders,
        totalAmount,
    });
});

// Update Order Status ---ADMIN
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Already Delivered", 400));
    }

    if (req.body.status === "Shipped") {
        order.shippedAt = Date.now();
        order.orderItems.forEach(async (i) => {
            await updateStock(i.product, i.quantity)
        });
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
}

// Delete Order ---ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    await order.remove();

    res.status(200).json({
        success: true,
    });
});