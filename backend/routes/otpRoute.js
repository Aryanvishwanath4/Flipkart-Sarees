const express = require('express');
const { sendOTP, verifyOTP } = require('../controllers/otpController');

const router = express.Router();

router.route('/otp/send').post(sendOTP);
router.route('/otp/verify').post(verifyOTP);

module.exports = router;
