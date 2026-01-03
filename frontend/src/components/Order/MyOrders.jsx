import { useEffect, useState } from 'react';
import { myOrders, clearErrors } from '../../actions/orderAction';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Layouts/Loader';
import { useSnackbar } from 'notistack';
import OrderItem from './OrderItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FilterListIcon from '@mui/icons-material/FilterList';
import Drawer from '@mui/material/Drawer';
import MinCategory from '../Layouts/MinCategory';
import MetaData from '../Layouts/MetaData';
import Sidebar from '../User/Sidebar';

const orderStatus = ["Processing", "Shipped", "Delivered"];
const dt = new Date();
const ordertime = [dt.getMonth(), dt.getFullYear() - 1, dt.getFullYear() - 2];

const MyOrders = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [status, setStatus] = useState("");
    const [orderTime, setOrderTime] = useState(0);
    const [search, setSearch] = useState("");
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const { orders, loading, error } = useSelector((state) => state.myOrders);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(myOrders());
    }, [dispatch, error, enqueueSnackbar]);

    useEffect(() => {
        if (loading === false) {
            setFilteredOrders(orders);
        }
    }, [loading, orders]);


    useEffect(() => {
        setSearch("");

        if (!status && +orderTime === 0) {
            setFilteredOrders(orders);
            return;
        }

        if (status && orderTime) {
            if (+orderTime === dt.getMonth()) {
                const filteredArr = orders.filter((order) => order.orderStatus === status &&
                    new Date(order.createdAt).getMonth() === +orderTime
                );
                setFilteredOrders(filteredArr);
            } else {
                const filteredArr = orders.filter((order) => order.orderStatus === status &&
                    new Date(order.createdAt).getFullYear() === +orderTime
                );
                setFilteredOrders(filteredArr);
            }
        } else if (!status) {
            if (+orderTime === dt.getMonth()) {
                const filteredArr = orders.filter((order) =>
                    new Date(order.createdAt).getMonth() === +orderTime
                );
                setFilteredOrders(filteredArr);
            } else {
                const filteredArr = orders.filter((order) =>
                    new Date(order.createdAt).getFullYear() === +orderTime
                );
                setFilteredOrders(filteredArr);
            }
        } else {
            const filteredArr = orders.filter((order) => order.orderStatus === status);
            setFilteredOrders(filteredArr);
        }
        // eslint-disable-next-line
    }, [status, orderTime]);

    const searchOrders = (e) => {
        e.preventDefault();
        if (!search.trim()) {
            enqueueSnackbar("Please enter a search term", { variant: "warning" });
            return;
        }
        const arr = orders.map((el) => ({
            ...el,
            orderItems: el.orderItems.filter((order) =>
                order.name.toLowerCase().includes(search.toLowerCase()))
        }));
        setFilteredOrders(arr);
    }

    const clearFilters = () => {
        setStatus("");
        setOrderTime(0);
    }

    const FiltersContent = () => (
        <div className="bg-white p-4 h-full">
            {/* Filters Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <p className="font-semibold text-gray-800">Filters</p>
                <button 
                    onClick={clearFilters} 
                    className="text-[#bf9847] text-sm font-medium hover:underline"
                >
                    Clear All
                </button>
            </div>

            {/* Order Status */}
            <div className="mb-6">
                <p className="font-medium text-gray-700 text-sm mb-3">ORDER STATUS</p>
                <FormControl component="fieldset">
                    <RadioGroup
                        onChange={(e) => setStatus(e.target.value)}
                        value={status}
                    >
                        {orderStatus.map((el, i) => (
                            <FormControlLabel 
                                value={el} 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#bf9847' } }} />} 
                                key={i} 
                                label={<span className="text-sm text-gray-600">{el}</span>} 
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </div>

            {/* Order Time */}
            <div>
                <p className="font-medium text-gray-700 text-sm mb-3">ORDER TIME</p>
                <FormControl component="fieldset">
                    <RadioGroup
                        onChange={(e) => setOrderTime(e.target.value)}
                        value={orderTime}
                    >
                        {ordertime.map((el, i) => (
                            <FormControlLabel 
                                value={el} 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#bf9847' } }} />} 
                                key={i} 
                                label={<span className="text-sm text-gray-600">{i === 0 ? "This Month" : el}</span>} 
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </div>
            
            {/* Apply Button (Mobile Only) */}
            <div className="mt-8 sm:hidden">
                <button 
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#bf9847] text-white py-2 rounded-md font-medium"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            <MetaData title="My Orders | Aishwarya Silks" />

            <MinCategory />
            <main className="w-full mt-24 sm:mt-0">

                <div className="flex gap-4 sm:w-11/12 sm:mt-4 m-auto mb-7 px-0 sm:px-0">

                    <Sidebar activeTab={"orders"} />

                    {/* Orders Content */}
                    <div className="flex-1 w-full overflow-hidden">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white p-4 sm:p-6 rounded-none sm:rounded-t-lg mb-0 sm:mb-4">
                            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                                <LocalShippingIcon fontSize="small" /> My Orders
                            </h1>
                            <p className="text-gray-300 text-xs sm:text-sm mt-1">Track and manage your orders</p>
                        </div>

                        {loading ? <Loader /> : (
                            <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-0">

                                {/* Filters Sidebar - Desktop Only */}
                                <div className="hidden sm:block sm:w-1/4">
                                    <div className="bg-white rounded-lg shadow">
                                        <FiltersContent />
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="flex-1 flex flex-col gap-4">

                                    {/* Search & Mobile Filter Button */}
                                    <div className="flex gap-2">
                                        <form onSubmit={searchOrders} className="flex-1 flex items-center bg-white rounded-lg shadow overflow-hidden border">
                                            <input 
                                                value={search} 
                                                onChange={(e) => setSearch(e.target.value)} 
                                                type="search" 
                                                placeholder="Search orders..." 
                                                className="flex-1 p-2.5 outline-none text-sm" 
                                            />
                                            <button 
                                                type="submit" 
                                                className="px-4 py-2.5 bg-[#bf9847] text-white hover:bg-[#a8843d] transition-colors flex items-center gap-1"
                                            >
                                                <SearchIcon fontSize="small" />
                                            </button>
                                        </form>
                                        
                                        {/* Mobile Filter Button */}
                                        <button 
                                            onClick={() => setShowFilters(true)}
                                            className="sm:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-lg shadow text-[#bf9847] font-medium text-sm"
                                        >
                                            <FilterListIcon fontSize="small" />
                                            Filter
                                        </button>
                                    </div>

                                    {/* Mobile Filter Drawer */}
                                    <Drawer
                                        anchor="bottom"
                                        open={showFilters}
                                        onClose={() => setShowFilters(false)}
                                        PaperProps={{
                                            sx: { borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }
                                        }}
                                    >
                                        <div className="w-full max-h-[80vh] overflow-y-auto">
                                            <div className="w-12 h-1.5 bg-gray-300 mx-auto mt-3 rounded-full" />
                                            <FiltersContent />
                                        </div>
                                    </Drawer>

                                    {/* Empty State */}
                                    {orders && filteredOrders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow">
                                            <LocalShippingIcon style={{ fontSize: 64 }} className="text-gray-300 mb-4" />
                                            <span className="text-lg font-medium text-gray-700">No orders found</span>
                                            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search</p>
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div className="flex flex-col gap-3">
                                        {orders && filteredOrders.map((order) => {
                                            const { _id, orderStatus, orderItems, createdAt, deliveredAt } = order;

                                            return (
                                                orderItems.map((item, index) => (
                                                    <OrderItem 
                                                        {...item} 
                                                        key={`${_id}-${index}`} 
                                                        orderId={_id} 
                                                        orderStatus={orderStatus} 
                                                        createdAt={createdAt} 
                                                        deliveredAt={deliveredAt} 
                                                    />
                                                ))
                                            )
                                        }).reverse()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default MyOrders;
