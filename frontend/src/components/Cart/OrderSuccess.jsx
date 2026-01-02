import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const OrderSuccess = ({ success }) => {

    const navigate = useNavigate();
    const [time, setTime] = useState(5);

    useEffect(() => {
        if (time === 0) {
            if (success) {
                navigate("/orders")
            } else {
                navigate("/cart")
            }
            return;
        };
        const intervalId = setInterval(() => {
            setTime(time - 1);
        }, 1000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line
    }, [time]);

    return (
        <>
            <MetaData title={`Transaction ${success ? "Successful" : "Failed"} | Aishwarya Silks`} />

            <main className="w-full mt-20 px-4">

                <div className="flex flex-col gap-4 items-center justify-center max-w-xl m-auto mb-7 bg-white shadow-lg rounded-lg p-8 pb-12 text-center border-t-4 border-[#bf9847]">
                    {success ? (
                        <CheckCircleIcon sx={{ fontSize: "80px" }} className="text-green-500 mb-2" />
                    ) : (
                        <ErrorIcon sx={{ fontSize: "80px" }} className="text-red-500 mb-2" />
                    )}
                    
                    <h1 className="text-3xl font-bold text-gray-800">
                        Order {success ? "Placed Successfully!" : "Payment Failed"}
                    </h1>
                    
                    <p className="text-gray-600 max-w-sm">
                        {success 
                            ? "Thank you for shopping with Aishwarya Silks. Your elegant selection is being processed."
                            : "We encountered an issue with your payment. Please try again or contact support."}
                    </p>

                    <div className="bg-gray-50 rounded-full px-6 py-2 mt-4">
                        <p className="text-sm text-gray-500">
                            Redirecting to {success ? "your orders" : "cart"} in <span className="font-bold text-[#bf9847]">{time}</span> seconds
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                        <Link 
                            to={success ? "/orders" : "/cart"} 
                            className="flex-1 bg-[#bf9847] py-3 text-white uppercase font-bold rounded shadow hover:bg-[#a8843d] transition-colors"
                        >
                            {success ? "View My Orders" : "Back to Cart"}
                        </Link>
                        <Link 
                            to="/" 
                            className="flex-1 border-2 border-gray-200 py-3 text-gray-600 uppercase font-bold rounded hover:bg-gray-50 transition-colors"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>

            </main>
        </>
    );
};

export default OrderSuccess;
