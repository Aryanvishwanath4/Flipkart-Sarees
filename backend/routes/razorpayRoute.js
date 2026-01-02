const express = require('express');
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createGuestOrder,
    getOrdersByPhone,
    getRazorpayKey
} = require('../controllers/razorpayController');

const { isOptionalAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

// Razorpay routes
router.route('/razorpay/key').get(getRazorpayKey);
router.route('/razorpay/create').post(createRazorpayOrder);
router.route('/razorpay/verify').post(verifyRazorpayPayment);

// Guest order routes
router.route('/order/guest').post(isOptionalAuthenticatedUser, createGuestOrder);
router.route('/orders/phone/:phone').get(getOrdersByPhone);

module.exports = router;
