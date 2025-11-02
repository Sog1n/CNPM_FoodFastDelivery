import React, { useEffect, useState } from 'react';
import { Grid, Typography, Modal, Box, Button, Card, CardContent } from '@mui/material';
import BackgroundImage from '../../assets/food.jpeg'; // Ensure the path is correct
import axios from 'axios';
import { RxCross2 } from "react-icons/rx";

const DelOrderManagement = () => {
//
//   const [orders, setOrders] = useState([]);
//
//   const getOrders = async () => {
//     try {
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getAllOrders`,
//         {
//           withCredentials: true,
//         }
//       );
//       console.log(response.data);
//       setOrders(response.data);
//     } catch (error) {
//       console.error(error);
//     }
//   };
//
//   useEffect(() => {
//     getOrders();
//   }, []);
//
//
//
//   const handleAccept = async (orderId) => {
//     try {
//
//       const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/order/assignDeliveryMan/${orderId}`, {
//         withCredentials: true,
//       });
//       if (response.status !== 200) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//
//       }
//       getOrders();
//     } catch (error) {
//       console.log(error);
//     }
//
//   };
//
//
//
//
//
//   return (
//     <div  className='bg-gray-100 ml-60 mt-[78px] min-h-screen pt-4 w-full font-poppins'>
//       <div className=' flex justify-center items-center font-semibold text-lg'>
//         Your Orders
//       </div>
//       {
//         orders?.map((order) => (
//
//
//           <div className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6 pt-4'>
//
//             <div className=' flex justify-center items-center font-semibold text-lg'>
//               ID : {order?.paymentId?.orderId}
//               {/* //Change this to payment order id */}
//             </div>
//
//             <div className='flex justify-between px-4 '>
//
//               {/* //Customer details */}
//               <div className='flex flex-col m-4 p-2 gap-y-3'>
//                 <div>
//                   Customer's Name : {order?.user?.ownerName}
//                 </div>
//                 <div>
//                   Customer's Phone : {order?.user?.phone}
//                 </div>
//                 <div className=' flex  items-center'>
//                   <p>Customer's Address : </p>
//                   {<p className=" p-3 text-wrap ">
//                     {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state},{order?.deliveryAddress?.country}
//                   </p>}
//                 </div>
//               </div>
//
//               {/* //Restaurant details */}
//               <div className='flex flex-col m-4 p-2 gap-y-3'>
//                 <div>
//                   Restaurant's Name : {order?.restaurant?.restaurantName}
//                 </div>
//                 <div>
//                   Restaurant's Phone : {order?.restaurant?.phone}
//                 </div>
//                 <div className=' flex  items-center'>
//                   <p>Restaurant's Address : </p>
//                   {<p className=" p-3 text-wrap ">
//                     {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName},{order?.restaurant?.countryName}
//                   </p>}
//                 </div>
//               </div>
//
//               {/* //Order details */}
//               <div className='flex flex-col justify-between  m-4 p-2 '>
//                 {
//                   order?.orderItems?.map((item) => (
//                     <>
//                       <div className='flex justify-between w-60 px-2'>
//                         <span className='flex gap-x-1 items-center '>
//                           {item?.quantity}
//                           <RxCross2 size={14} />
//                           {item?.item?.dishName}
//                         </span>
//
//                       </div>
//                     </>
//                   ))
//                 }
//
//                 <div>
//                   <button className='bg-green-500 text-white rounded-md p-2 mb-2' onClick={() => handleAccept(order._id)}>Accept Order</button>
//                 </div>
//
//               </div>
//
//
//             </div>
//
//           </div>
//
//
//         )
//         )
//       }
//     </div>
//   );
// };


  const [orders, setOrders] = useState([]);
  const [drones, setDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState({}); // { [orderId]: droneId }
  const [assigningOrderId, setAssigningOrderId] = useState(null);

  const getOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getAllOrders`, { withCredentials: true } );
      console.log('📦 Fetched ready orders:', response.data);
      console.log('📊 Number of ready orders:', response.data?.length);
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    }
  };

  const getDrones = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/drones`);
      setDrones(response.data.filter(drone => drone.status === 'AVAILABLE'));
    } catch (error) {
      console.error('Error fetching drones:', error);
    }
  };

  useEffect(() => {
    getOrders();
    getDrones();
  }, []);

  const handleAssignDrone = async (orderId) => {
    const droneId = selectedDrone[orderId];
    if (!droneId) {
      alert('⚠️ Please select a drone first!');
      return;
    }

    try {
      setAssigningOrderId(orderId);
      const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/order/assignDrone/${orderId}`,
          { droneId },
          { withCredentials: true }
      );

      if (response.status === 200) {
        // Clear selection for this order
        setSelectedDrone(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });

        // Refresh both orders and drones
        await Promise.all([getOrders(), getDrones()]);

        // Success feedback
        alert('✅ Drone assigned successfully! Order is now shipping.');
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error assigning drone:', error);
      alert('❌ Failed to assign drone. Please try again.');
    } finally {
      setAssigningOrderId(null);
    }
  };

  return (
      <div className='bg-gray-100 ml-60 mt-[78px] min-h-screen pt-4 w-full font-poppins'>
        {/* Header Section */}
        <div className='flex flex-col items-center mb-6'>
          <h2 className='font-bold text-3xl text-gray-800'>📦 Ready Orders for Pickup</h2>
          <p className='text-sm text-gray-600 mt-2'>Orders are prepared and ready. Assign drones to start delivery.</p>
          <div className='mt-3 flex gap-x-4 text-sm'>
            <span className='px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold'>
              Ready Orders: {orders?.length || 0}
            </span>
            <span className='px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold'>
              Available Drones: {drones?.length || 0}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {orders?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <div className='text-6xl mb-4'>📦</div>
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Ready Orders</h3>
            <p className='text-gray-500'>There are no orders ready for pickup at the moment.</p>
            <p className='text-sm text-gray-400 mt-2'>Orders will appear here once restaurant marks them as "Ready"</p>
          </div>
        ) : null}

        {/* Orders List */}
        {orders?.map((order) => (
            <div key={order._id} className='flex flex-col bg-white shadow-lg rounded-lg font-poppins mx-8 my-6 overflow-hidden'>

              {/* Header with Status Badge */}
              <div className='bg-orange-50 border-b border-orange-200 p-4'>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-x-3'>
                    <span className='font-bold text-lg text-gray-800'>
                      Order ID: {order?.paymentId?.orderId}
                    </span>
                    <span className='px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold'>
                      📦 READY FOR PICKUP
                    </span>
                  </div>
                  <div className='text-sm text-gray-600'>
                    <span className='font-semibold'>Total:</span> $ {order?.totalAmount?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className='flex justify-between px-4 py-4'>

                {/* Customer Info */}
                <div className='flex flex-col m-4 p-3 gap-y-3 flex-1 bg-blue-50 rounded-lg'>
                  <h4 className='font-semibold text-gray-700 mb-2 flex items-center gap-x-2'>
                    <span className='text-xl'>📍</span> Delivery To:
                  </h4>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Name:</span>
                    <span className='ml-2 text-gray-600'>{order?.user?.ownerName}</span>
                  </div>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Phone:</span>
                    <span className='ml-2 text-gray-600'>{order?.user?.phone}</span>
                  </div>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Address:</span>
                    <p className="ml-2 mt-1 text-gray-600">
                      {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state}, {order?.deliveryAddress?.country}
                    </p>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className='flex flex-col m-4 p-3 gap-y-3 flex-1 bg-purple-50 rounded-lg'>
                  <h4 className='font-semibold text-gray-700 mb-2 flex items-center gap-x-2'>
                    <span className='text-xl'>🏪</span> Pickup From:
                  </h4>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Restaurant:</span>
                    <span className='ml-2 text-gray-600'>{order?.restaurant?.restaurantName}</span>
                  </div>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Phone:</span>
                    <span className='ml-2 text-gray-600'>{order?.restaurant?.phone}</span>
                  </div>
                  <div className='text-sm'>
                    <span className='font-semibold text-gray-700'>Address:</span>
                    <p className="ml-2 mt-1 text-gray-600">
                      {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName}, {order?.restaurant?.countryName}
                    </p>
                  </div>
                </div>

                {/* Order Items & Drone Assignment */}
                <div className='flex flex-col m-4 p-3 gap-y-3 flex-1 bg-green-50 rounded-lg'>
                  <h4 className='font-semibold text-gray-700 mb-2 flex items-center gap-x-2'>
                    <span className='text-xl'>🍽️</span> Order Items:
                  </h4>
                  <div className='bg-white rounded p-2 mb-3 max-h-32 overflow-y-auto'>
                    {order?.orderItems?.map((item, idx) => (
                      <div key={idx} className='flex justify-between py-1 text-sm border-b border-gray-200 last:border-0'>
                        <span className='flex gap-x-1 items-center text-gray-700'>
                          <span className='font-semibold'>{item?.quantity}</span>
                          <RxCross2 size={12} />
                          <span>{item?.item?.dishName}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Drone Assignment Section */}
                  <div className='bg-white rounded-lg p-3 border-2 border-dashed border-blue-300'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      🚁 Select Drone:
                    </label>
                    <select
                        value={selectedDrone[order._id] || ''}
                        onChange={e => setSelectedDrone({ ...selectedDrone, [order._id]: e.target.value })}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg mb-3 focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="">-- Choose a Drone --</option>
                      {drones.map(drone => (
                          <option key={drone._id} value={drone._id}>
                            🚁 {drone.droneId} (Battery: {drone.batteryLevel}%)
                          </option>
                      ))}
                    </select>
                    <button
                        className='w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-x-2'
                        onClick={() => handleAssignDrone(order._id)}
                        disabled={!selectedDrone[order._id] || assigningOrderId === order._id}
                    >
                      {assigningOrderId === order._id ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>Assign & Start Shipping</span>
                        </>
                      )}
                    </button>
                    {!selectedDrone[order._id] && assigningOrderId !== order._id && (
                      <p className='text-xs text-gray-500 mt-2 text-center'>
                        Please select a drone first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>
  );
};

export default DelOrderManagement;