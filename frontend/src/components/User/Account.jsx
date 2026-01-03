import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../Layouts/Loader';
import MinCategory from '../Layouts/MinCategory';
import MetaData from '../Layouts/MetaData';

const Account = () => {

    const navigate = useNavigate();
    const { user, loading, isAuthenticated } = useSelector(state => state.user);

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    const getFirstName = () => {
        return user?.name?.split(" ")[0] || "";
    };

    const getLastName = () => {
        const nameArray = user?.name?.split(" ") || [];
        return nameArray.length > 1 ? nameArray.slice(1).join(" ") : "";
    };

    return (
        <>
            <MetaData title="My Profile | Aishwarya Silks" />

            {loading ? <Loader /> :
                <>
                    <MinCategory />
                    <main className="w-full mt-24 sm:mt-0">

                        <div className="flex gap-4 sm:w-11/12 sm:mt-4 m-auto mb-7 px-4 sm:px-0">

                            <Sidebar activeTab={"profile"} />

                            {/* Profile Content */}
                            <div className="flex-1 overflow-hidden">
                                
                                {/* Header */}
                                <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white p-6 rounded-t-lg">
                                    <h1 className="text-2xl font-semibold">My Profile</h1>
                                    <p className="text-gray-300 text-sm mt-1">Manage your account details</p>
                                </div>

                                {/* Profile Form */}
                                <div className="bg-white shadow rounded-b-lg p-6">
                                    
                                    {/* Personal Information */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                                            <Link to="/account/update" className="text-[#bf9847] text-sm font-medium hover:underline">
                                                Edit
                                            </Link>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-lg p-4 border">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">First Name</label>
                                                <p className="text-gray-800 font-medium mt-1">{getFirstName()}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4 border">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Last Name</label>
                                                <p className="text-gray-800 font-medium mt-1">{getLastName() || "-"}</p>
                                            </div>
                                        </div>

                                        {/* Gender */}
                                        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Gender</label>
                                            <p className="text-gray-800 font-medium mt-1 capitalize">{user?.gender || "Not specified"}</p>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
                                            <div className="flex gap-4">
                                                <Link to="/account/update" className="text-[#bf9847] text-sm font-medium hover:underline">
                                                    Edit
                                                </Link>
                                                <Link to="/password/update" className="text-[#bf9847] text-sm font-medium hover:underline">
                                                    Change Password
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-lg p-4 border">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Email Address</label>
                                                <p className="text-gray-800 font-medium mt-1">{user?.email}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4 border">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</label>
                                                <p className="text-gray-800 font-medium mt-1">
                                                    {user?.phone ? `+91 ${user.phone}` : "Not added"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Security */}
                                    <div className="border-t pt-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h2>
                                        <div className="flex flex-wrap gap-4">
                                            <Link 
                                                to="/password/update" 
                                                className="px-4 py-2 border border-[#bf9847] text-[#bf9847] rounded-lg hover:bg-[#bf9847] hover:text-white transition-colors text-sm font-medium"
                                            >
                                                Change Password
                                            </Link>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </main>
                </>
            }
        </>
    );
};

export default Account;
