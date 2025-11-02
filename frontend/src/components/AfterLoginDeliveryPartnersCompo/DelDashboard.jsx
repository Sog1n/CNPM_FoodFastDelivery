import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import UserImage from '../../assets/graph.jpeg'; // Ensure the path is correct
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


import { RxCross2 } from "react-icons/rx";

const CurrentOrder = ({ orders, getOrders }) => {

  // Only show orders that are in 'shipping' status (being delivered by drone)
  const currentOrders = orders.filter((order) => order.orderStatus === 'shipping' && order.drone !== null);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const delId = localStorage.getItem('delId');

  //Update order status to delivered
  const updateOrderStatus = async (orderId, droneId) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/order/updateOrderStatus/${orderId}`,
        {
          orderStatus: 'delivered'
        },
        {
          withCredentials: true,
        }
      );
      console.log('status updated', res.data);

      // Refresh orders after successful update
      getOrders(delId);

    } catch (error) {
      console.log(error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <>
      {currentOrders?.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='text-6xl mb-4'>🚁</div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Orders in Delivery</h3>
          <p className='text-gray-500'>All drones are available. No active deliveries at the moment.</p>
        </div>
      ) : null}

      {
        currentOrders?.map((order) => (
          <div key={order._id} className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6'>

            {/* Header with Order ID and Status */}
            <div className='bg-purple-50 border-b border-purple-200 p-4 rounded-t-md'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-x-3'>
                  <span className='font-semibold text-lg text-gray-800'>
                    Order ID: {order?.paymentId?.orderId}
                  </span>
                  <span className='px-4 py-1 bg-purple-500 text-white rounded-full text-sm font-bold'>
                    🚁 IN DELIVERY
                  </span>
                </div>
                {order?.drone && (
                  <div className='text-sm text-gray-600'>
                    <span className='font-semibold'>Drone:</span> {order?.drone?.droneId || 'Assigned'}
                  </div>
                )}
              </div>
            </div>

            <div className='flex justify-between px-4 py-4'>

              {/* Customer details */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>📍 Delivery To:</h4>
                <div className='text-sm'>
                  <span className='font-semibold'>Name:</span> {order?.user?.ownerName}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Phone:</span> {order?.user?.phone}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Address:</span>
                  <p className="mt-1 text-gray-600">
                    {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state}, {order?.deliveryAddress?.country}
                  </p>
                </div>
              </div>

              {/* Restaurant details */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>🏪 Pickup From:</h4>
                <div className='text-sm'>
                  <span className='font-semibold'>Restaurant:</span> {order?.restaurant?.restaurantName}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Phone:</span> {order?.restaurant?.phone}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Address:</span>
                  <p className="mt-1 text-gray-600">
                    {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName}, {order?.restaurant?.countryName}
                  </p>
                </div>
              </div>

              {/* Order details and Actions */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>📦 Order Items:</h4>
                <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                  {
                    order?.orderItems?.map((item, idx) => (
                      <div key={idx} className='flex justify-between py-1 text-sm'>
                        <span className='flex gap-x-1 items-center'>
                          {item?.quantity}
                          <RxCross2 size={12} />
                          {item?.item?.dishName}
                        </span>
                      </div>
                    ))
                  }
                  <div className='border-t border-gray-300 mt-2 pt-2'>
                    <div className='font-semibold text-right'>
                      Total: $ {order?.totalAmount?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  className='bg-green-500 text-white rounded-lg p-3 font-semibold hover:bg-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  onClick={() => updateOrderStatus(order._id, order?.drone?._id)}
                  disabled={updatingOrderId === order._id}
                >
                  {updatingOrderId === order._id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>✓ Mark as Delivered</>
                  )}
                </button>
              </div>

            </div>

          </div>
        ))
      }
    </>
  )
};

const PastOrder = ({ orders }) => {

  // Show all delivered orders
  const pastOrders = orders.filter((order) => order.orderStatus === 'delivered');

  return (
    <>
      {pastOrders?.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='text-6xl mb-4'>📦</div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Delivered Orders</h3>
          <p className='text-gray-500'>No completed deliveries yet.</p>
        </div>
      ) : null}

      {
        pastOrders?.map((order) => (
          <div key={order._id} className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6'>

            {/* Header with Order ID and Status */}
            <div className='bg-green-50 border-b border-green-200 p-4 rounded-t-md'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-x-3'>
                  <span className='font-semibold text-lg text-gray-800'>
                    Order ID: {order?.paymentId?.orderId}
                  </span>
                  <span className='px-4 py-1 bg-green-500 text-white rounded-full text-sm font-bold'>
                    ✓ DELIVERED
                  </span>
                </div>
                {order?.drone && (
                  <div className='text-sm text-gray-600'>
                    <span className='font-semibold'>Delivered by:</span> {order?.drone?.droneId || 'Drone'}
                  </div>
                )}
              </div>
            </div>

            <div className='flex justify-between px-4 py-4'>

              {/* Customer details */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>📍 Delivered To:</h4>
                <div className='text-sm'>
                  <span className='font-semibold'>Name:</span> {order?.user?.ownerName}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Phone:</span> {order?.user?.phone}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Address:</span>
                  <p className="mt-1 text-gray-600">
                    {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state}, {order?.deliveryAddress?.country}
                  </p>
                </div>
              </div>

              {/* Restaurant details */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>🏪 From Restaurant:</h4>
                <div className='text-sm'>
                  <span className='font-semibold'>Restaurant:</span> {order?.restaurant?.restaurantName}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Phone:</span> {order?.restaurant?.phone}
                </div>
                <div className='text-sm'>
                  <span className='font-semibold'>Address:</span>
                  <p className="mt-1 text-gray-600">
                    {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName}, {order?.restaurant?.countryName}
                  </p>
                </div>
              </div>

              {/* Order details */}
              <div className='flex flex-col m-4 p-2 gap-y-3 flex-1'>
                <h4 className='font-semibold text-gray-700 mb-2'>📦 Order Items:</h4>
                <div className='bg-gray-50 rounded-lg p-3'>
                  {
                    order?.orderItems?.map((item, idx) => (
                      <div key={idx} className='flex justify-between py-1 text-sm'>
                        <span className='flex gap-x-1 items-center'>
                          {item?.quantity}
                          <RxCross2 size={12} />
                          {item?.item?.dishName}
                        </span>
                      </div>
                    ))
                  }
                  <div className='border-t border-gray-300 mt-2 pt-2'>
                    <div className='font-semibold text-right'>
                      Total: $ {order?.totalAmount?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ))
      }
    </>
  )
}



const DelDashboard = () => {
  const navigate = useNavigate();
  const [delUser, setDelUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [isCurrentOrder, setIsCurrentOrder] = useState(true);

  

  
  //Get all orders of a deliveryman

  const getOrders = async (delId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getAllAcceptedOrders`, {
        withCredentials: true,
      });
      console.log(delId);
      console.log(response.data);
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  
 
  const callDelDashboard = async () => {

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/DelLayout/DelDashboard`, { // Update with the correct backend URL and port
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include"
      });

      if (res.status !== 200) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem('delId', data._id);
      getOrders(data._id);
      setDelUser(data);
      if (!data) {
        throw new Error("No data received");
      }
    } catch (err) {
      console.log(err);
      navigate('/DelLogin');
    }
  };

  useEffect(() => {
    callDelDashboard();
    
  }, []);




  return (
    <div className='bg-gray-100 ml-60 mt-[78px] w-full font-poppins'>
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
        isCurrentOrder ? <CurrentOrder orders= {orders} getOrders={getOrders} /> : <PastOrder orders={orders} />
      }
    </div>
  );
};

export default DelDashboard;