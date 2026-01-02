import { useDispatch, useSelector } from 'react-redux';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../actions/userAction';

const Sidebar = ({ activeTab }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { user } = useSelector(state => state.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar("Logged out successfully", { variant: "success" });
        navigate("/login");
    }

    return (
        <div className="hidden sm:flex flex-col gap-4 w-1/4 px-1">

            {/* Profile Card */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border-l-4 border-[#bf9847]">
                <div className="w-14 h-14 rounded-full border-2 border-[#bf9847] overflow-hidden">
                    <img 
                        draggable="false" 
                        className="h-full w-full object-cover" 
                        src={user?.avatar?.url || "https://res.cloudinary.com/demo/image/upload/v1/avatars/default.png"} 
                        alt="Avatar" 
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-xs text-gray-500">Welcome,</p>
                    <h2 className="font-semibold text-gray-800">{user?.name}</h2>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col bg-white rounded-lg shadow overflow-hidden">

                {/* My Orders */}
                <Link 
                    to="/orders" 
                    className={`flex items-center gap-4 px-4 py-4 border-b hover:bg-amber-50 transition-colors ${activeTab === "orders" ? "bg-amber-50 border-l-4 border-[#bf9847]" : ""}`}
                >
                    <span className="text-[#bf9847]"><FolderIcon /></span>
                    <span className="flex-1 font-medium text-gray-700">My Orders</span>
                    <ChevronRightIcon className="text-gray-400" />
                </Link>

                {/* Profile */}
                <Link 
                    to="/account" 
                    className={`flex items-center gap-4 px-4 py-4 border-b hover:bg-amber-50 transition-colors ${activeTab === "profile" ? "bg-amber-50 border-l-4 border-[#bf9847]" : ""}`}
                >
                    <span className="text-[#bf9847]"><PersonIcon /></span>
                    <span className="flex-1 font-medium text-gray-700">Profile</span>
                    <ChevronRightIcon className="text-gray-400" />
                </Link>

                {/* Saved Addresses */}
                <Link 
                    to="/account/addresses" 
                    className={`flex items-center gap-4 px-4 py-4 border-b hover:bg-amber-50 transition-colors ${activeTab === "addresses" ? "bg-amber-50 border-l-4 border-[#bf9847]" : ""}`}
                >
                    <span className="text-[#bf9847]"><LocationOnIcon /></span>
                    <span className="flex-1 font-medium text-gray-700">Saved Addresses</span>
                    <ChevronRightIcon className="text-gray-400" />
                </Link>

                {/* Wishlist */}
                <Link 
                    to="/wishlist" 
                    className={`flex items-center gap-4 px-4 py-4 border-b hover:bg-amber-50 transition-colors ${activeTab === "wishlist" ? "bg-amber-50 border-l-4 border-[#bf9847]" : ""}`}
                >
                    <span className="text-[#bf9847]"><FavoriteIcon /></span>
                    <span className="flex-1 font-medium text-gray-700">My Wishlist</span>
                    <ChevronRightIcon className="text-gray-400" />
                </Link>

                {/* Logout */}
                <div 
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-red-50 transition-colors cursor-pointer"
                >
                    <span className="text-red-500"><PowerSettingsNewIcon /></span>
                    <span className="flex-1 font-medium text-gray-700">Logout</span>
                    <ChevronRightIcon className="text-gray-400" />
                </div>

            </div>

            {/* Help Section */}
            <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Need Help?</p>
                <div className="flex flex-col gap-1 text-sm text-gray-500">
                    <Link to="/password/update" className="hover:text-[#bf9847]">Change Password</Link>
                    <Link to="/orders" className="hover:text-[#bf9847]">Track Order</Link>
                    <a href="mailto:support@aishwaryasilks.com" className="hover:text-[#bf9847]">Contact Us</a>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
