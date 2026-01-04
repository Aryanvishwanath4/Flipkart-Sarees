import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { emptyCart } from '../../actions/cartAction';
import { loadUser } from '../../actions/userAction';
import { VERIFY_OTP_SUCCESS } from '../../constants/userConstants';

const ExpressCheckout = ({ open, onClose, cartItems, totalPrice }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    // Check if user is logged in
    const { user, isAuthenticated, otpVerified, verifiedIdentifier, verifiedAt } = useSelector((state) => state.user);

    // Step management - Skip phone step if logged in
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Step 1: Phone & OTP (skipped if logged in)
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otpChannel, setOtpChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [sessionToken, setSessionToken] = useState('');

    // Step 2: Address
    const [address, setAddress] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '', // Added email field
    });
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Step 3: Payment
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    
    // Post-order account creation
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [accountForm, setAccountForm] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    // States list for India
    const states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ];

    // Initialize based on logged-in status
    useEffect(() => {
        let timer;
        if (open) {
            // Set a small loading state to prevent flickering of "0 items"
            setInitialLoading(true);
            timer = setTimeout(() => {
                setInitialLoading(false);
            }, 400);

            if (isAuthenticated && user) {
                // User is logged in - skip phone step
                setPhoneVerified(true);
                setPhone(user.phone || '');
                setEmail(user.email || '');
                setStep(2);
                
                // Pre-fill address from user's saved addresses
                if (user.addresses && user.addresses.length > 0) {
                    setSavedAddresses(user.addresses);
                    const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                    if (defaultAddr) {
                        setAddress({
                            name: defaultAddr.name || user.name,
                            address: defaultAddr.address || '',
                            city: defaultAddr.city || '',
                            state: defaultAddr.state || '',
                            pincode: defaultAddr.pincode || '',
                            phone: user.phone || '', // Pre-fill phone
                            email: user.email || '', // Pre-fill email
                        });
                        setSelectedAddressId(defaultAddr._id);
                    }
                } else {
                    // Pre-fill name from user
                    setAddress(prev => ({ ...prev, name: user.name, phone: user.phone || '', email: user.email || '' }));
                }
            } else if (otpVerified && verifiedIdentifier && verifiedAt) {
                // Check if verification is still valid (30 mins)
                const isExpired = Date.now() - verifiedAt > 30 * 60 * 1000;
                
                if (!isExpired) {
                    // Determine if identifier is phone or email
                    const isEmail = verifiedIdentifier.includes('@');
                    let verifiedPhone = '';
                    
                    if (isEmail) {
                        setEmail(verifiedIdentifier);
                        setOtpChannel('email');
                    } else {
                        setPhone(verifiedIdentifier);
                        verifiedPhone = verifiedIdentifier;
                        setOtpChannel('whatsapp');
                    }
                    
                    setPhoneVerified(true);
                    setStep(2);
                    
                    // Pre-fill phone/email in address if we have it
                    setAddress(prev => ({ 
                        ...prev, 
                        phone: verifiedPhone || prev.phone,
                        email: isEmail ? verifiedIdentifier : prev.email
                    }));
                    
                    enqueueSnackbar(`Welcome back! Your ${isEmail ? 'email' : 'phone'} is already verified.`, { variant: "info" });
                } else {
                     // Expired - Reset to step 1
                     setStep(1);
                     setPhoneVerified(false);
                     setOtpSent(false); // Reset local state
                     setPhone('');
                     setEmail('');
                     setOtp('');
                }
            } else {
                // Guest - start from phone step
                setStep(1);
                setPhoneVerified(false);
                setOtpSent(false); // Reset local state
                setPhone('');
                setEmail('');
                setOtp('');
            }
        }
        return () => clearTimeout(timer);
    }, [open, isAuthenticated, user, otpVerified, verifiedIdentifier, verifiedAt, enqueueSnackbar]);

    // Send OTP
    const handleSendOTP = async () => {
        if (otpChannel === 'whatsapp' && phone.length !== 10) {
            enqueueSnackbar('Please enter a valid 10-digit phone number', { variant: 'warning' });
            return;
        }
        if (otpChannel === 'email' && !/\S+@\S+\.\S+/.test(email)) {
            enqueueSnackbar('Please enter a valid email address', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                channel: otpChannel,
                ...(otpChannel === 'email' ? { email } : { phone })
            };
            
            const { data } = await axios.post('/api/v1/otp/send', payload);
            
            if (data.success) {
                setOtpSent(true);
                setOtp(''); // Clear previous OTP on resend
                enqueueSnackbar(`OTP sent successfully to ${otpChannel === 'email' ? email : phone}!`, { variant: 'success' });
            }
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Failed to send OTP', { variant: 'error' });
        }
        setLoading(false);
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            enqueueSnackbar('Please enter 6-digit OTP', { variant: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                otp,
                ...(otpChannel === 'email' ? { email } : { phone })
            };

            const { data } = await axios.post('/api/v1/otp/verify', payload);
            
            if (data.success) {
                setPhoneVerified(true);
                setSessionToken(data.sessionToken);
                
                // Sync with Redux for persistence
                dispatch({
                    type: VERIFY_OTP_SUCCESS,
                    payload: data
                });

                // If verified via phone, pre-fill address phone
                if (otpChannel === 'whatsapp' && phone) {
                    setAddress(prev => ({ ...prev, phone: phone }));
                } else if (otpChannel === 'email' && email) {
                    setAddress(prev => ({ ...prev, email: email }));
                }

                enqueueSnackbar('Verified successfully!', { variant: 'success' });
                setStep(2);
            }
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Invalid OTP', { variant: 'error' });
        }
        setLoading(false);
    };

    // Validate address
    const validateAddress = () => {
        if (!address.name || !address.address || !address.city || !address.state || !address.pincode || !address.phone || (!isAuthenticated && !address.email)) {
            enqueueSnackbar('Please fill all address fields including Email and Phone', { variant: 'warning' });
            return false;
        }
        if (address.pincode.length !== 6) {
            enqueueSnackbar('Please enter a valid 6-digit pincode', { variant: 'warning' });
            return false;
        }
        if (address.phone.length !== 10) {
            enqueueSnackbar('Please enter a valid 10-digit phone number', { variant: 'warning' });
            return false;
        }
        return true;
    };

    // Proceed to payment
    const handleProceedToPayment = () => {
        if (validateAddress()) {
            setStep(3);
        }
    };

    // Place order
    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            // Create order items from cart
            const orderItems = cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                product: item.product,
            }));

            // For demo, simulate payment
            const paymentInfo = {
                id: paymentMethod === 'cod' ? 'COD_' + Date.now() : 'DEMO_' + Date.now(),
                status: paymentMethod === 'cod' ? 'COD' : 'Paid',
            };

            // Create guest order (or use authenticated order for logged users)
            const { data } = await axios.post('/api/v1/order/guest', {
                shippingInfo: {
                    address: address.address,
                    city: address.city,
                    state: address.state,
                    country: 'India',
                    pincode: parseInt(address.pincode),
                    phoneNo: parseInt(address.phone) || 0, // Use address phone
                },
                orderItems,
                paymentInfo,
                totalPrice: paymentMethod === 'cod' ? totalPrice + 100 : totalPrice,
                guestInfo: {
                    name: address.name,
                    phone: address.phone, // Use address phone
                    email: address.email || accountForm.email || (otpChannel === 'email' ? email : (user?.email || '')),
                },
            });

            if (data.success) {
                setOrderPlaced(true);
                setOrderId(data.order._id);
                dispatch(emptyCart());
                enqueueSnackbar('Order placed successfully!', { variant: 'success' });
            }
        } catch (error) {
            console.error('Order error:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to place order', { variant: 'error' });
        }
        setLoading(false);
    };

    // Create account from guest order
    const handleCreateAccount = async () => {
        if (!accountForm.email || !accountForm.password) {
            enqueueSnackbar('Please fill email and password', { variant: 'warning' });
            return;
        }
        if (accountForm.password !== accountForm.confirmPassword) {
            enqueueSnackbar('Passwords do not match', { variant: 'warning' });
            return;
        }
        if (accountForm.password.length < 8) {
            enqueueSnackbar('Password must be at least 8 characters', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post('/api/v1/create-from-guest', {
                name: address.name,
                email: accountForm.email,
                phone: address.phone, // Use address phone
                password: accountForm.password,
                address: {
                    name: address.name,
                    address: address.address,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    phone: address.phone, // Use address phone
                }
            });

            if (data.success) {
                // Reload user to update Redux state (auto-login)
                dispatch(loadUser());
                enqueueSnackbar('Account created! You are now logged in.', { variant: 'success' });
                setShowCreateAccount(false);
            }
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Failed to create account', { variant: 'error' });
        }
        setLoading(false);
    };

    // Order success handler
    const handleOrderSuccess = () => {
        onClose();
        navigate(`/orders/success`);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8" onError={(e) => e.target.style.display = 'none'} />
                        <span className="font-semibold text-lg">Express Checkout</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <CloseIcon />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="bg-primary-blue text-white px-4 py-2 text-sm">
                    Easy Returns | Free Shipping | Secure Payments
                </div>
                <div className="flex items-center justify-between px-6 py-3 border-b">
                    <div className={`flex items-center gap-1 ${step >= 1 ? 'text-primary-blue' : 'text-gray-400'}`}>
                        <PhoneIcon fontSize="small" />
                        <span className="text-sm">Mobile</span>
                        {phoneVerified && <CheckCircleIcon fontSize="small" className="text-green-500" />}
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                    <div className={`flex items-center gap-1 ${step >= 2 ? 'text-primary-blue' : 'text-gray-400'}`}>
                        <LocationOnIcon fontSize="small" />
                        <span className="text-sm">Address</span>
                        {step > 2 && <CheckCircleIcon fontSize="small" className="text-green-500" />}
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                    <div className={`flex items-center gap-1 ${step >= 3 ? 'text-primary-blue' : 'text-gray-400'}`}>
                        <PaymentIcon fontSize="small" />
                        <span className="text-sm">Pay</span>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">🛒 Order Summary</span>
                        {initialLoading ? (
                            <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                        ) : (
                            <span className="text-xs text-gray-400">({cartItems.length} items)</span>
                        )}
                    </div>
                    {initialLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                        <span className="font-bold text-lg text-primary-blue">₹{totalPrice.toLocaleString()}</span>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 relative min-h-[300px]">
                    {initialLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                            <CircularProgress size={40} />
                            <p className="mt-4 text-gray-500 text-sm animate-pulse">Preparing your order...</p>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Verification */}
                            {step === 1 && !orderPlaced && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-lg">Login / Verify</h3>
                            
                            {!otpSent && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Send OTP via:</span>
                                    <RadioGroup
                                        row
                                        name="otp-channel"
                                        value={otpChannel}
                                        onChange={(e) => setOtpChannel(e.target.value)}
                                        className="mb-2"
                                    >
                                        <FormControlLabel value="whatsapp" control={<Radio size="small" />} label={<span className="text-sm">WhatsApp</span>} />
                                        <FormControlLabel value="email" control={<Radio size="small" />} label={<span className="text-sm">Email</span>} />
                                    </RadioGroup>
                                </div>
                            )}

                            {otpChannel === 'whatsapp' ? (
                                <div className="flex border rounded overflow-hidden">
                                    <span className="bg-gray-100 px-3 py-3 flex items-center text-gray-600">+91</span>
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        placeholder="Enter 10-digit number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        className="flex-1 px-3 py-3 outline-none"
                                        disabled={otpSent}
                                    />
                                </div>
                            ) : (
                                <input
                                    type="email"
                                    placeholder="Enter Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border rounded px-3 py-3 outline-none"
                                    disabled={otpSent}
                                />
                            )}

                            {otpSent && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Enter OTP sent to {otpChannel === 'whatsapp' ? `+91 ${phone}` : email}
                                    </p>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full border rounded px-3 py-3 outline-none text-center text-lg tracking-widest"
                                    />
                                    <p className="text-xs text-gray-500">Demo OTP: 123456</p>
                                </div>
                            )}

                            <button
                                onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                                disabled={loading}
                                className="w-full bg-primary-orange text-white py-3 rounded font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {loading && <CircularProgress size={20} color="inherit" />}
                                {otpSent ? 'Verify OTP' : `Send ${otpChannel === 'email' ? 'Email' : 'WhatsApp'} OTP`}
                            </button>
                            
                            {otpSent && (
                                <button
                                    onClick={handleSendOTP}
                                    className="w-full text-primary-blue text-sm text-center mt-2 hover:underline"
                                >
                                    Resend OTP
                                </button>
                            )}

                            {otpSent && (
                                <button
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                    className="w-full text-primary-blue text-sm"
                                >
                                    Change {otpChannel === 'email' ? 'Email' : 'Number'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 2: Address */}
                    {step === 2 && !orderPlaced && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-lg">Shipping Address</h3>
                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={address.name}
                                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                className="w-full border rounded px-3 py-3 outline-none focus:border-primary-blue"
                            />
                            <input
                                type="email"
                                placeholder="Email Address (for order confirmation) *"
                                value={address.email}
                                onChange={(e) => setAddress({ ...address, email: e.target.value })}
                                className="w-full border rounded px-3 py-3 outline-none focus:border-primary-blue"
                            />

                            {/* NEW PHONE FIELD */}
                            <div className="flex border rounded overflow-hidden">
                                <span className="bg-gray-100 px-3 py-3 flex items-center text-gray-600">+91</span>
                                <input
                                    type="tel"
                                    maxLength="10"
                                    placeholder="Phone Number *"
                                    value={address.phone}
                                    onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                                    className="flex-1 px-3 py-3 outline-none"
                                />
                            </div>

                            <textarea
                                placeholder="Address (House No, Street, Area) *"
                                value={address.address}
                                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                                rows="2"
                                className="w-full border rounded px-3 py-3 outline-none focus:border-primary-blue resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="City *"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className="border rounded px-3 py-3 outline-none focus:border-primary-blue"
                                />
                                <select
                                    value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                    className="border rounded px-3 py-3 outline-none focus:border-primary-blue bg-white"
                                >
                                    <option value="">Select State *</option>
                                    {states.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Pincode *"
                                value={address.pincode}
                                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                                className="w-full border rounded px-3 py-3 outline-none focus:border-primary-blue"
                            />
                            <button
                                onClick={handleProceedToPayment}
                                className="w-full bg-primary-orange text-white py-3 rounded font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                            >
                                Continue to Payment →
                            </button>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && !orderPlaced && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-lg">Payment Method</h3>
                            
                            {/* UPI / Razorpay Option */}
                            <label className={`flex items-center justify-between p-4 border rounded cursor-pointer ${paymentMethod === 'razorpay' ? 'border-primary-blue bg-blue-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'razorpay'}
                                        onChange={() => setPaymentMethod('razorpay')}
                                        className="w-4 h-4 accent-primary-blue"
                                    />
                                    <div>
                                        <p className="font-medium">UPI / Cards / Netbanking</p>
                                        <p className="text-xs text-gray-500">Pay via Razorpay</p>
                                    </div>
                                </div>
                                <span className="font-bold">₹{totalPrice.toLocaleString()}</span>
                            </label>

                            {/* COD Option */}
                            <label className={`flex items-center justify-between p-4 border rounded cursor-pointer ${paymentMethod === 'cod' ? 'border-primary-blue bg-blue-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="w-4 h-4 accent-primary-blue"
                                    />
                                    <div>
                                        <p className="font-medium">Cash on Delivery</p>
                                        <p className="text-xs text-gray-500">Extra ₹100 COD charges</p>
                                    </div>
                                </div>
                                <span className="font-bold">₹{(totalPrice + 100).toLocaleString()}</span>
                            </label>

                            {/* Order Summary */}
                            <div className="bg-gray-50 p-4 rounded space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>₹{totalPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600">FREE</span>
                                </div>
                                {paymentMethod === 'cod' && (
                                    <div className="flex justify-between text-sm">
                                        <span>COD Charges</span>
                                        <span>₹100</span>
                                    </div>
                                )}
                                <hr />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>₹{(paymentMethod === 'cod' ? totalPrice + 100 : totalPrice).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full bg-primary-orange text-white py-3 rounded font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {loading && <CircularProgress size={20} color="inherit" />}
                                {paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay & Place Order'}
                            </button>
                        </div>
                    )}

                    {/* Order Success */}
                    {orderPlaced && (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircleIcon style={{ fontSize: 64 }} className="text-green-500" />
                            <h2 className="text-2xl font-bold text-green-600">Order Placed!</h2>
                            <p className="text-gray-600">Your order has been placed successfully.</p>
                            <p className="text-sm text-gray-500">Order ID: {orderId}</p>

                            {/* Account Creation Option for Guests */}
                            {!isAuthenticated && !showCreateAccount && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <PersonAddIcon className="text-primary-blue" />
                                        <span className="font-medium">Create an account?</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Save your details for faster checkout and track your orders easily.
                                    </p>
                                    <button
                                        onClick={() => setShowCreateAccount(true)}
                                        className="w-full bg-primary-blue text-white py-2 rounded font-medium text-sm hover:bg-blue-600 transition-colors"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            )}

                            {/* Account Creation Form */}
                            {!isAuthenticated && showCreateAccount && (
                                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3 mt-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <PersonAddIcon fontSize="small" /> Create Your Account
                                    </h3>
                                    <input
                                        type="email"
                                        placeholder="Email Address *"
                                        value={accountForm.email}
                                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                        className="w-full border rounded px-3 py-2 outline-none focus:border-primary-blue text-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password (min 8 chars) *"
                                        value={accountForm.password}
                                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                                        className="w-full border rounded px-3 py-2 outline-none focus:border-primary-blue text-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password *"
                                        value={accountForm.confirmPassword}
                                        onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                        className="w-full border rounded px-3 py-2 outline-none focus:border-primary-blue text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowCreateAccount(false)}
                                            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded font-medium text-sm"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={handleCreateAccount}
                                            disabled={loading}
                                            className="flex-1 bg-primary-blue text-white py-2 rounded font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {loading && <CircularProgress size={14} color="inherit" />}
                                            Create Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleOrderSuccess}
                                className="w-full bg-primary-orange text-white py-3 rounded font-medium hover:bg-orange-600 transition-colors mt-4"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    )}
                    </>
                )}
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span>🔒 100% Secure</span>
                    <span>•</span>
                    <span>PCI DSS</span>
                    <span>•</span>
                    <span>Easy Returns</span>
                </div>
            </div>
        </div>
    );
};

export default ExpressCheckout;
