import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import UserImage from '../../assets/graph.jpeg'; // Ensure the path is correct
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


import { RxCross2 } from "react-icons/rx";

const CurrentOrder = ({ orders, getOrders }) => {

  const currentOrders = orders.filter((order) => order.orderStatus !== 'delivered' && order.drone !== null);

  const [status, setStatus] = useState('');
  const delId = localStorage.getItem('delId');
  //Update order status
  const updateOrderStatus = async (orderId) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/order/updateOrderStatus/${orderId}`,
        {
          orderStatus: 'delivered'
        },
        {
          withCredentials: true,
        }
      );
      console.log('status updated', res.data);
      getOrders(delId);

    } catch (error) {
      console.log(error);
    }
  }

 

  return (
    <>
      {
        currentOrders?.map((order) => (
          <>

            <div className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6 pt-4'>

              <div className=' flex justify-center items-center font-semibold text-lg'>
                ID : {order?.paymentId?.orderId}
                {/* //Change this to payment order id */}
              </div>

              <div className='flex justify-between px-4 '>

                {/* //Customer details */}
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>
                    Customer's Name : {order?.user?.ownerName}
                  </div>
                  <div>
                    Customer's Phone : {order?.user?.phone}
                  </div>
                  <div className=' flex  items-center'>
                    <p>Customer's Address : </p>
                    {<p className=" p-3 text-wrap ">
                      {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state},{order?.deliveryAddress?.country}
                    </p>}
                  </div>
                </div>

                {/* //Restaurant details */}
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>
                    Restaurant's Name : {order?.restaurant?.restaurantName}
                  </div>
                  <div>
                    Restaurant's Phone : {order?.restaurant?.phone}
                  </div>
                  <div className=' flex  items-center'>
                    <p>Restaurant's Address : </p>
                    {<p className=" p-3 text-wrap ">
                      {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName},{order?.restaurant?.countryName}
                    </p>}
                  </div>
                </div>

                {/* //Order details */}
                <div className='flex flex-col justify-between  m-4 p-2 '>
                  {
                    order?.orderItems?.map((item) => (
                      <>
                        <div className='flex justify-between w-60 px-2'>
                          <span className='flex gap-x-1 items-center '>
                            {item?.quantity}
                            <RxCross2 size={14} />
                            {item?.item?.dishName}
                          </span>

                        </div>
                      </>
                    ))
                  }

                  <div>
                    <button className='bg-green-500 text-white rounded-md p-2 mb-2' onClick={() => updateOrderStatus(order._id)}>Mark As Delivered</button>
                  </div>

                </div>


              </div>

            </div>

          </>
        )
        )
      }
    </>
  )
};

const PastOrder = ({ orders }) => {

  const pastOrders = orders.filter((order) => order.orderStatus === 'delivered');
  console.log(pastOrders);
  return (
    <>
      {
        pastOrders?.map((order) => (
          <>
            <div className='flex flex-col bg-white shadow-md rounded-md font-poppins mx-8 my-6 pt-4'>

              <div className=' flex justify-center items-center font-semibold text-lg'>
                ID : {order?.paymentId?.orderId}
                {/* //Change this to payment order id */}
              </div>

              <div className='flex justify-between px-4 '>

                {/* //Customer details */}
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>
                    Customer's Name : {order?.user?.ownerName}
                  </div>
                  <div>
                    Customer's Phone : {order?.user?.phone}
                  </div>
                  <div className=' flex  items-center'>
                    <p>Customer's Address : </p>
                    {<p className=" p-3 text-wrap ">
                      {order?.deliveryAddress?.address}, {order?.deliveryAddress?.city}, {order?.deliveryAddress?.state},{order?.deliveryAddress?.country}
                    </p>}
                  </div>
                </div>

                {/* //Restaurant details */}
                <div className='flex flex-col m-4 p-2 gap-y-3'>
                  <div>
                    Restaurant's Name : {order?.restaurant?.restaurantName}
                  </div>
                  <div>
                    Restaurant's Phone : {order?.restaurant?.phone}
                  </div>
                  <div className=' flex  items-center'>
                    <p>Restaurant's Address : </p>
                    {<p className=" p-3 text-wrap ">
                      {order?.restaurant?.address}, {order?.restaurant?.city}, {order?.restaurant?.stateName},{order?.restaurant?.countryName}
                    </p>}
                  </div>
                </div>

                {/* //Order details */}
                <div className='flex flex-col justify-between  m-4 p-2 '>
                  {
                    order?.orderItems?.map((item) => (
                      <>
                        <div className='flex justify-between w-60 px-2'>
                          <span className='flex gap-x-1 items-center '>
                            {item?.quantity}
                            <RxCross2 size={14} />
                            {item?.item?.dishName}
                          </span>

                        </div>
                      </>
                    ))
                  }

                 

                </div>


              </div>

            </div>
          </>
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