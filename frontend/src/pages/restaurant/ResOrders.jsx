import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { RxCross2 } from "react-icons/rx";

const CurrentOrder = ({ currentOrders, getOrders }) => {

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeStatusTab, setActiveStatusTab] = useState('all');

    //Update order status
    const updateOrderStatus = async (orderId, newstatus) => {
        // Show confirmation modal for cancel action
        if (newstatus === 'cancel') {
            const order = currentOrders.find(o => o._id === orderId);
            setOrderToCancel(order);
            setShowCancelModal(true);
            return;
        }

        try {
            setIsUpdating(true);
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/order/updateOrder/${orderId}`,
                {
                    orderStatus: newstatus
                },
                {
                    withCredentials: true,
                }
            );
            console.log('status updated', res.data);
            getOrders();
        } catch (error) {
            console.log(error);
            alert('Failed to update order status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }

    const confirmCancelOrder = async () => {
        if (!orderToCancel) return;

        try {
            setIsUpdating(true);
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/order/updateOrder/${orderToCancel._id}`,
                {
                    orderStatus: 'cancel'
                },
                {
                    withCredentials: true,
                }
            );
            console.log('Order cancelled', res.data);
            getOrders();
            setShowCancelModal(false);
            setOrderToCancel(null);
        } catch (error) {
            console.log(error);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setOrderToCancel(null);
    }

    // Filter orders based on active status tab
    const filteredOrders = activeStatusTab === 'all'
        ? currentOrders
        : currentOrders.filter(order => order.orderStatus === activeStatusTab);

    // Count orders by status
    const orderCounts = {
        all: currentOrders.length,
        pending: currentOrders.filter(o => o.orderStatus === 'pending').length,
        confirmed: currentOrders.filter(o => o.orderStatus === 'confirmed').length,
        ready: currentOrders.filter(o => o.orderStatus === 'ready').length,
        shipping: currentOrders.filter(o => o.orderStatus === 'shipping').length,
    };

    return (
        <>
            {/* Status Filter Tabs */}
            <div className='mx-20 my-6'>
                <div className='flex gap-3 p-4 bg-white rounded-lg shadow-md overflow-x-auto'>
                    <button
                        onClick={() => setActiveStatusTab('all')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeStatusTab === 'all'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>📋 All Orders</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            activeStatusTab === 'all' ? 'bg-white text-green-600' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orderCounts.all}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveStatusTab('pending')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeStatusTab === 'pending'
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>🔵 Pending</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            activeStatusTab === 'pending' ? 'bg-white text-yellow-600' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orderCounts.pending}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveStatusTab('confirmed')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeStatusTab === 'confirmed'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>✓ Confirmed</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            activeStatusTab === 'confirmed' ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orderCounts.confirmed}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveStatusTab('ready')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeStatusTab === 'ready'
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>📦 Ready</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            activeStatusTab === 'ready' ? 'bg-white text-orange-600' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orderCounts.ready}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveStatusTab('shipping')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeStatusTab === 'shipping'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>🚁 Shipping</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            activeStatusTab === 'shipping' ? 'bg-white text-purple-600' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orderCounts.shipping}
                        </span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredOrders.length === 0 && (
                <div className='mx-20 my-10 bg-white rounded-lg shadow-md p-12 text-center'>
                    <div className='text-6xl mb-4'>📭</div>
                    <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                        No {activeStatusTab === 'all' ? '' : activeStatusTab} orders
                    </h3>
                    <p className='text-gray-500'>
                        {activeStatusTab === 'all'
                            ? 'All orders are completed or cancelled'
                            : `No orders in ${activeStatusTab} status at the moment`}
                    </p>
                </div>
            )}

            {/* Orders List */}
            {
                filteredOrders?.map((order) => (
                    <>
                        <div className='flex flex-col mx-20 my-6 bg-white shadow-md rounded-md font-poppins'>
                            {/* Top Section: Order Info */}
                            <div className='flex justify-between border-b border-gray-200 pb-4'>
                                <div className='flex flex-col m-4 p-2 gap-y-3'>
                                    <div className='font-semibold text-lg'>
                                        ID : {order?.paymentId?.orderId}
                                    </div>
                                    <div>
                                        Customer's Name : {order?.user?.ownerName}
                                    </div>
                                </div>
                                <div className='flex flex-col justify-center m-4'>
                                    {
                                        order?.orderItems?.map((item) => (
                                            <>
                                                <div className='flex justify-between w-60 px-2'>
                                                    <span className='flex gap-x-1 items-center '>
                                                        {item?.quantity}
                                                        <RxCross2 size={14} />
                                                        {item?.item?.dishName}
                                                    </span>
                                                    <p className='flex w-20 justify-end'>
                                                        $ {item?.item?.price * item?.quantity}
                                                    </p>
                                                </div>
                                            </>
                                        ))
                                    }
                                    <div className='flex justify-end bg-neutral-200 rounded-md mt-2 py-1 px-2 w-full'>
                                        <span className='font-semibold text-sm'>
                                            Total bill : $ {order?.totalAmount}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Status and Actions - Separated */}
                            <div className='flex justify-between items-center px-6 py-4'>
                                {/* Left: Status Display */}
                                <div className='flex items-center gap-x-3'>
                                    <span className='text-sm font-semibold text-gray-600'>Status:</span>
                                    <span className={`px-5 py-2 rounded-lg text-sm font-bold ${
                                        order?.orderStatus === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                                        order?.orderStatus === 'confirmed' ? 'bg-blue-200 text-blue-900' :
                                        order?.orderStatus === 'ready' ? 'bg-orange-200 text-orange-900' :
                                        order?.orderStatus === 'shipping' ? 'bg-purple-200 text-purple-900' :
                                        order?.orderStatus === 'cancel' ? 'bg-red-200 text-red-900' :
                                        'bg-gray-200 text-gray-900'
                                    }`}>
                                        {order?.orderStatus === 'pending' ? '🔵 PENDING' :
                                         order?.orderStatus === 'confirmed' ? '✓ CONFIRMED' :
                                         order?.orderStatus === 'ready' ? '📦 READY' :
                                         order?.orderStatus === 'shipping' ? '🚁 SHIPPING' :
                                         order?.orderStatus === 'cancel' ? '✕ CANCELLED' :
                                         order?.orderStatus?.toUpperCase()}
                                    </span>
                                </div>

                                {/* Right: Action Buttons */}
                                <div className='flex gap-x-3'>
                                    {order?.orderStatus === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'confirmed')}
                                                disabled={isUpdating}
                                                className='bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                            >
                                                {isUpdating ? '⏳ Processing...' : '→ Confirm Order'}
                                            </button>
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'cancel')}
                                                disabled={isUpdating}
                                                className='bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                            >
                                                ✕ Cancel
                                            </button>
                                        </>
                                    )}

                                    {order?.orderStatus === 'confirmed' && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'ready')}
                                                disabled={isUpdating}
                                                className='bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                            >
                                                {isUpdating ? '⏳ Processing...' : '→ Mark as Ready'}
                                            </button>
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'cancel')}
                                                disabled={isUpdating}
                                                className='bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                            >
                                                ✕ Cancel
                                            </button>
                                        </>
                                    )}

                                    {order?.orderStatus === 'ready' && (
                                        <div className='bg-green-50 border-2 border-green-300 px-5 py-2 rounded-lg text-sm text-green-700 font-semibold'>
                                            ✓ Waiting for drone pickup
                                        </div>
                                    )}

                                    {order?.orderStatus === 'shipping' && (
                                        <div className='bg-purple-50 border-2 border-purple-300 px-5 py-2 rounded-lg text-sm text-purple-700 font-semibold'>
                                            🚁 Drone is delivering
                                        </div>
                                    )}

                                    {order?.orderStatus === 'cancel' && (
                                        <div className='bg-red-50 border-2 border-red-300 px-5 py-2 rounded-lg text-sm text-red-700 font-semibold'>
                                            ✕ Order cancelled
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )
                )
            }

            {/* Cancel Order Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-6">
                            <div className="flex items-center justify-center">
                                <div className="bg-white rounded-full p-3">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white text-center mt-4">
                                Cancel Order?
                            </h3>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-600 text-center mb-4">
                                Are you sure you want to cancel this order?
                            </p>

                            {orderToCancel && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-700">Order ID:</span>
                                        <span className="text-sm text-gray-900">{orderToCancel?.paymentId?.orderId}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-700">Customer:</span>
                                        <span className="text-sm text-gray-900">{orderToCancel?.user?.ownerName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">Amount:</span>
                                        <span className="text-sm font-bold text-gray-900">$ {orderToCancel?.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                <p className="text-sm text-yellow-800">
                                    <span className="font-semibold">Note:</span> Customer will be notified and refunded within 3-5 business days.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={closeCancelModal}
                                disabled={isUpdating}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={isUpdating}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isUpdating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel Order'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
};

const PastOrder = ({ pastOrders }) => {
    return (
        <>
            {
                pastOrders?.map((order) => (
                    <>
                        <div className='flex flex-col mx-20 my-6 bg-white shadow-md rounded-md font-poppins'>
                            {/* Top Section: Order Info */}
                            <div className='flex justify-between border-b border-gray-200 pb-4'>
                                <div className='flex flex-col m-4 p-2 gap-y-3'>
                                    <div className='font-semibold text-lg'>
                                        ID : {order?.paymentId?.orderId}
                                    </div>
                                    <div>
                                        Customer's Name : {order?.user?.ownerName}
                                    </div>
                                </div>
                                <div className='flex flex-col justify-center m-4'>
                                    {
                                        order?.orderItems?.map((item) => (
                                            <>
                                                <div className='flex justify-between w-60 px-2'>
                                                    <span className='flex gap-x-1 items-center '>
                                                        {item?.quantity}
                                                        <RxCross2 size={14} />
                                                        {item?.item?.dishName}
                                                    </span>
                                                    <p className='flex w-20 justify-end'>
                                                        $ {item?.item?.price * item?.quantity}
                                                    </p>
                                                </div>
                                            </>
                                        ))
                                    }
                                    <div className='flex justify-end bg-neutral-200 rounded-md mt-2 py-1 px-2 w-full'>
                                        <span className='font-semibold text-sm'>
                                            Total bill : $ {order?.totalAmount}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Status Display */}
                            <div className='flex items-center px-6 py-4'>
                                <div className='flex items-center gap-x-3'>
                                    <span className='text-sm font-semibold text-gray-600'>Status:</span>
                                    <span className={`px-5 py-2 rounded-lg text-sm font-bold ${
                                        order?.orderStatus === 'delivered' 
                                            ? 'bg-green-200 text-green-900' 
                                            : order?.orderStatus === 'cancel'
                                            ? 'bg-red-200 text-red-900'
                                            : 'bg-gray-200 text-gray-900'
                                    }`}>
                                        {order?.orderStatus === 'delivered' 
                                            ? '✓ DELIVERED' 
                                            : order?.orderStatus === 'cancel'
                                            ? '✕ CANCELLED'
                                            : order?.orderStatus?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                ))
            }
        </>
    )
}

const ResOrders = () => {

    //Get restaurant orders
    const resId = localStorage.getItem('restaurantId');
    const [orders, setOrders] = useState([]);
    const [isCurrentOrder, setIsCurrentOrder] = useState(true);

    const getOrders = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getOrdersByResId/${resId}`,
                {
                    withCredentials: true,
                }
            );
            console.log(res.data);
            setOrders(res.data);
        } catch (error) {
            console.log(error);
        }
    }



    useEffect(() => {
        getOrders();
    }, []);

    const currentOrders = orders.filter((order) => order.orderStatus !== 'delivered' && order.orderStatus !== 'cancel');
    const pastOrders = orders.filter((order) => order.orderStatus === 'delivered' || order.orderStatus === 'cancel');


    return (
        <div className='bg-gray-100 ml-60 mt-[78px] w-full font-poppins min-h-screen'>
            <div>
                <ul className='flex gap-x-6 p-5 text-neutral-500 ml-10'>
                    <button className={`${isCurrentOrder ? "text-green-500" : ""} flex p-1 bg-white rounded-md w-36 justify-center shadow-md`}
                        onClick={() => setIsCurrentOrder(true)}>
                        Current orders
                    </button>
                    <button className={`${!isCurrentOrder ? "text-red-500" : ""} flex p-1 bg-white rounded-md w-32 justify-center shadow-md`}
                        onClick={() => setIsCurrentOrder(false)}>
                        Past orders
                    </button>
                </ul>
            </div>

            {
                isCurrentOrder ? <CurrentOrder currentOrders={currentOrders} getOrders={getOrders} /> : <PastOrder pastOrders={pastOrders} />
            }
        </div>

    )
}

export default ResOrders