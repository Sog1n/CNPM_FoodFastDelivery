import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/AfterLoginUsersComp/usersNavbar';
import axios from 'axios';

const StatusBadge = ({ status }) => {
  let bgColor, textColor, displayText;
  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      displayText = 'PENDING';
      break;
    case 'confirmed':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      displayText = 'CONFIRMED';
      break;
    case 'shipping':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      displayText = 'SHIPPING';
      break;
    case 'delivered':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      displayText = 'DELIVERED';
      break;
    case 'cancel':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      displayText = 'CANCELLED';
      break;
    default:
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-900';
      displayText = status?.toUpperCase() || 'UNKNOWN';
  }

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${bgColor} ${textColor}`}>
      {displayText}
    </span>
  );
};

const Usersorder = () => {  

const [orders, setOrders] = useState([]);
const [selectedStatus, setSelectedStatus] = useState('all');
const [cancellingOrderId, setCancellingOrderId] = useState(null);
const [showCancelModal, setShowCancelModal] = useState(false);
const [orderToCancel, setOrderToCancel] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getOrdersByUserId`,
        {withCredentials: true

        });
        if(response.status === 200){
          setOrders(response.data);
        }
        else{
          console.log("Error fetching orders");
        }
    } catch (error) {
      console.log(error);
    }
  }

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrderId(orderToCancel._id);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/order/cancelOrder/${orderToCancel._id}`,
        { orderStatus: 'cancel' },
        { withCredentials: true }
      );

      if (response.status === 200) {
        fetchOrders(); // Refresh orders list
        closeCancelModal();
        // Show success message
        setTimeout(() => {
          alert('✅ Order cancelled successfully!');
        }, 300);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('❌ Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Define status priority for sorting (lower number = higher priority)
  const statusPriority = {
    'pending': 1,
    'confirmed': 2,
    'shipping': 3,
    'delivered': 4,
    'cancel': 5
  };

  // Filter orders by status
  const filteredOrders = selectedStatus === 'all'
    ? [...orders].sort((a, b) => {
        // Sort by status priority
        const priorityA = statusPriority[a.orderStatus] || 999;
        const priorityB = statusPriority[b.orderStatus] || 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // If same status, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    : orders.filter(order => order.orderStatus === selectedStatus)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Count orders by status
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
    shipping: orders.filter(o => o.orderStatus === 'shipping').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    cancel: orders.filter(o => o.orderStatus === 'cancel').length,
  };

  const statusTabs = [
    { value: 'all', label: 'All Orders', color: 'text-gray-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
    { value: 'shipping', label: 'Shipping', color: 'text-purple-600' },
    { value: 'delivered', label: 'Delivered', color: 'text-green-600' },
    { value: 'cancel', label: 'Cancelled', color: 'text-red-600' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Orders</h2>

        {/* Status Tabs */}
        <div className="bg-white shadow-md rounded-lg mb-6 p-4">
          <div className="flex flex-wrap gap-3">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStatus === tab.value
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 ' + tab.color
                }`}
              >
                {tab.label} ({orderCounts[tab.value]})
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order?._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order?.paymentId?.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order?.restaurant?.restaurantName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order?.orderItems?.map((item, index) => (
                        <p key={item?._id || index} className="text-sm">{item?.item?.dishName} x {item?.quantity}</p>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">$ {order?.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <StatusBadge status={order?.orderStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {order?.orderStatus === 'pending' && (
                        <button
                          onClick={() => openCancelModal(order)}
                          disabled={cancellingOrderId === order._id}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            cancellingOrderId === order._id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
                          }`}
                        >
                          {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      {order?.orderStatus !== 'pending' && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {selectedStatus === 'all'
                ? "You haven't placed any orders yet."
                : `You don't have any ${selectedStatus} orders.`}
            </p>
          </div>
        )}
      </div>

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
                    <span className="text-sm font-semibold text-gray-700">Restaurant:</span>
                    <span className="text-sm text-gray-900">{orderToCancel?.restaurant?.restaurantName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Amount:</span>
                    <span className="text-sm font-bold text-gray-900">$ {orderToCancel?.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Note:</span> This action cannot be undone. Your payment will be refunded within 3-5 business days.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={closeCancelModal}
                disabled={cancellingOrderId === orderToCancel?._id}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancellingOrderId === orderToCancel?._id}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {cancellingOrderId === orderToCancel?._id ? (
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
    </div>
  );
};

export default Usersorder;