import { Radio, RadioGroup, FormControlLabel } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loginUser, sendOtp, verifyOtp } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';

const Login = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();

    const { loading, isAuthenticated, error, otpSent, isNewUser } = useSelector((state) => state.user);

    const [loginMethod, setLoginMethod] = useState("password"); // "password" | "otp"
    const [otpChannel, setOtpChannel] = useState("whatsapp"); // "email" | "whatsapp"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(loginUser(email, password));
    }

    const handleOtpRequest = (e) => {
        e.preventDefault();
        if (otpChannel === "email") {
             if (!email) {
                enqueueSnackbar("Please enter valid email", { variant: "error" });
                return;
             }
        } else {
            if (phone.length !== 10) {
                enqueueSnackbar("Please enter valid 10-digit phone number", { variant: "error" });
                return;
            }
        }
        dispatch(sendOtp(phone, email, otpChannel));
    }

    const handleOtpVerify = (e) => {
        e.preventDefault();
        dispatch(verifyOtp(phone, email, otp));
    }

    const redirect = location.search ? location.search.split("=")[1] : "account";

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isAuthenticated) {
            navigate(`/${redirect}`)
        }
        if (isNewUser) {
            enqueueSnackbar("New user? Please register.", { variant: "info" });
            navigate("/register", { state: { phone, email, otpChannel } });
        }
        if (otpSent) {
             enqueueSnackbar("OTP Sent to your phone/email", { variant: "success" });
        }
    }, [dispatch, error, isAuthenticated, redirect, navigate, enqueueSnackbar, isNewUser, otpSent, phone]);

    return (
        <>
            <MetaData title="Login | Flipkart" />

            {loading && <BackdropLoader />}
            <main className="w-full mt-12 sm:pt-20 sm:mt-0">

                {/* <!-- row --> */}
                <div className="flex sm:w-4/6 sm:mt-4 m-auto mb-7 bg-white shadow-lg">
                    {/* <!-- sidebar column  --> */}
                    <div className="loginSidebar bg-primary-blue p-10 pr-12 hidden sm:flex flex-col gap-4 w-2/5">
                        <h1 className="font-medium text-white text-3xl">Login</h1>
                        <p className="text-gray-200 text-lg">Get access to your Orders, Wishlist and Recommendations</p>
                    </div>
                    {/* <!-- sidebar column  --> */}

                    {/* <!-- login column --> */}
                    <div className="flex-1 overflow-hidden">

                        {/* <!-- edit info container --> */}
                        <div className="text-center py-10 px-4 sm:px-14">

                            {/* Tabs */}
                            <div className="flex justify-center gap-6 mb-6 border-b pb-2">
                                <button 
                                    className={`font-medium pb-2 ${loginMethod === "password" ? "text-primary-blue border-b-2 border-primary-blue" : "text-gray-500"}`}
                                    onClick={() => setLoginMethod("password")}
                                >
                                    Password
                                </button>
                                <button 
                                    className={`font-medium pb-2 ${loginMethod === "otp" ? "text-primary-blue border-b-2 border-primary-blue" : "text-gray-500"}`}
                                    onClick={() => setLoginMethod("otp")}
                                >
                                    OTP
                                </button>
                            </div>

                            {/* <!-- input container --> */}
                            {loginMethod === "password" ? (
                                <form onSubmit={handleLogin}>
                                    <div className="flex flex-col w-full gap-4">

                                        <TextField
                                            fullWidth
                                            id="email"
                                            label="Email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <TextField
                                            fullWidth
                                            id="password"
                                            label="Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        
                                        <div className="flex flex-col gap-2.5 mt-2 mb-32">
                                            <p className="text-xs text-primary-grey text-left">By continuing, you agree to Flipkart's <a href="https://www.flipkart.com/pages/terms" className="text-primary-blue"> Terms of Use</a> and <a href="https://www.flipkart.com/pages/privacypolicy" className="text-primary-blue"> Privacy Policy.</a></p>
                                            <button type="submit" className="text-white py-3 w-full bg-primary-orange shadow hover:shadow-lg rounded-sm font-medium">Login</button>
                                            <Link to="/password/forgot" className="hover:bg-gray-50 text-primary-blue text-center py-3 w-full shadow border rounded-sm font-medium">Forgot Password?</Link>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={otpSent ? handleOtpVerify : handleOtpRequest}>
                                    <div className="flex flex-col w-full gap-4">
                                        
                                        {!otpSent && (
                                            <div className="flex flex-col gap-2 text-left">
                                                <span className="text-xs text-gray-500 font-medium">Send OTP via:</span>
                                                <RadioGroup
                                                    row
                                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                                    name="row-radio-buttons-group"
                                                    value={otpChannel}
                                                    onChange={(e) => setOtpChannel(e.target.value)}
                                                >
                                                    <FormControlLabel value="whatsapp" control={<Radio size="small" />} label={<span className="text-sm">WhatsApp</span>} />
                                                    <FormControlLabel value="email" control={<Radio size="small" />} label={<span className="text-sm">Email</span>} />
                                                </RadioGroup>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-4">
                                            {otpChannel === "email" ? (
                                                 <TextField
                                                    fullWidth
                                                    id="otp-email"
                                                    label="Email Address"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    disabled={otpSent}
                                                />
                                            ) : (
                                                <TextField
                                                    fullWidth
                                                    id="phone"
                                                    label="Phone Number"
                                                    type="number"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    required
                                                    disabled={otpSent}
                                                    onInput={(e) => {
                                                        e.target.value = Math.max(0, parseInt(e.target.value) ).toString().slice(0,10)
                                                    }}
                                                />
                                            )}
                                            
                                            {otpSent && (
                                                <TextField
                                                    fullWidth
                                                    id="otp"
                                                    label="Enter OTP"
                                                    type="number"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                />
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2.5 mt-2 mb-32">
                                            <p className="text-xs text-primary-grey text-left">By continuing, you agree to Flipkart's <a href="https://www.flipkart.com/pages/terms" className="text-primary-blue"> Terms of Use</a> and <a href="https://www.flipkart.com/pages/privacypolicy" className="text-primary-blue"> Privacy Policy.</a></p>
                                            <button type="submit" className="text-white py-3 w-full bg-primary-orange shadow hover:shadow-lg rounded-sm font-medium">
                                                {otpSent ? "Verify & Login" : "Request OTP"}
                                            </button>
                                            {otpSent && (
                                                <button
                                                    type="button"
                                                    onClick={handleOtpRequest}
                                                    className="w-full text-primary-blue text-sm mt-2 font-medium"
                                                >
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            )}
                            {/* <!-- input container --> */}

                            <Link to="/register" className="font-medium text-sm text-primary-blue">New to Flipkart? Create an account</Link>
                        </div>
                        {/* <!-- edit info container --> */}

                    </div>
                    {/* <!-- login column --> */}
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default Login;
