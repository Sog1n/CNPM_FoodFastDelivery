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

  const getOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/order/getAllOrders`, { withCredentials: true } );
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getDrones = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/drones`);
      setDrones(response.data.filter(drone => drone.status === 'AVAILABLE'));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getOrders();
    getDrones();
  }, []);

  const handleAssignDrone = async (orderId) => {
    const droneId = selectedDrone[orderId];
    if (!droneId) {
      alert('Please select a drone');
      return;
    }
    try {
      const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/order/assignDrone/${orderId}`,
          { droneId },
          { withCredentials: true }
      );
      if (response.status !== 200) throw new Error(`HTTP error! Status: ${response.status}`);
      getOrders();
    } catch (error) {
      console.log(error);
    }
  };

  return (
      <div className='bg-gray-100 ml-60 mt-[78px] min-h-screen pt-4 w-full font-poppins'>
        <div className='flex flex-col items-center mb-4'>
          <h2 className='font-bold text-2xl text-gray-800'>Ready Orders for Pickup</h2>
          <p className='text-sm text-gray-600 mt-2'>Assign drones to orders that are ready for delivery</p>
        </div>
        {orders?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <div className='text-6xl mb-4'>📦</div>
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Ready Orders</h3>
            <p className='text-gray-500'>There are no orders ready for pickup at the moment.</p>
          </div>
        ) : null}
        {orders?.map((order) => (
            <div key={order._id} className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6 pt-4'>
              <div className='flex justify-center items-center font-semibold text-lg'>
                ID : {order?.paymentId?.orderId}
              </div>
              <div className='flex justify-between px-4 '>
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>Customer's Name : {order?.user?.ownerName}</div>
                  <div>Customer's Phone : {order?.user?.phone}</div>
                  <div className='flex items-center'>
                    <p>Customer's Address : </p>
                    <p className="p-3 text-wrap">
                      {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state},{order?.deliveryAddress?.country}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>Restaurant's Name : {order?.restaurant?.restaurantName}</div>
                  <div>Restaurant's Phone : {order?.restaurant?.phone}</div>
                  <div className='flex items-center'>
                    <p>Restaurant's Address : </p>
                    <p className="p-3 text-wrap">
                      {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName},{order?.restaurant?.countryName}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col justify-between m-4 p-2'>
                  {order?.orderItems?.map((item, idx) => (
                      <div key={idx} className='flex justify-between w-60 px-2'>
                  <span className='flex gap-x-1 items-center'>
                    {item?.quantity}
                    <RxCross2 size={14} />
                    {item?.item?.dishName}
                  </span>
                      </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <select
                        value={selectedDrone[order._id] || ''}
                        onChange={e => setSelectedDrone({ ...selectedDrone, [order._id]: e.target.value })}
                        className="border p-2 rounded"
                    >
                      <option value="">Select Drone</option>
                      {drones.map(drone => (
                          <option key={drone._id} value={drone._id}>
                            {drone.droneId} ({drone.batteryLevel}%)
                          </option>
                      ))}
                    </select>
                    <button
                        className='bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600 transition-all font-semibold'
                        onClick={() => handleAssignDrone(order._id)}
                    >
                      Assign Drone & Start Shipping
                    </button>
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>
  );
};

export default DelOrderManagement;