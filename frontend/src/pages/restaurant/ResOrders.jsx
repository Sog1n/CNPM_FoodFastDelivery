import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RxCross2 } from "react-icons/rx";

const CurrentOrder = ({ currentOrders, getOrders }) => {

    const [status, setStatus] = useState('');

    //Update order status
    const updateOrderStatus = async (orderId, newstatus) => {
        try {
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
        }
    }

    const handleStatusChange = (e, orderId) => {
        setStatus(e.target.value);
        updateOrderStatus(orderId, e.target.value);
    }


    return (
        <>
            {
                currentOrders?.map((order) => (
                    <>
                        <div className='flex justify-between mx-20 my-6 bg-white shadow-md rounded-md font-poppins '>
                            <div className='flex flex-col m-4 p-2 gap-y-3'>
                                <div className='font-semibold text-lg'>
                                    ID : {order?.paymentId?.orderId}
                                    {/* //Change this to payment order id */}
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
                            <div className='flex flex-col m-4 gap-y-2'>
                                <label htmlFor="status" className='text-sm'>
                                    Status
                                </label>
                                <select
                                    name=""
                                    id=""
                                    value={order?.orderStatus}
                                    onChange={(e) => { handleStatusChange(e, order?._id) }}
                                    className='shadow-md border-none rounded-md mr-6'>
                                    {/* <option value={order.orderStatus}>{order.orderStatus}</option> */}
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipping">Shipping</option>
                                </select>
                                <p className='mt-4 text-neutral-500 text-sm'>
                                    
                                    {order.deliveryman?`${order?.deliveryman?.ownerName} assigned `:'No deliveryman assigned yet'}
                                </p>
                            </div>

                        </div>
                    </>
                )
                )
            }
        </>
    )
};

const PastOrder = ({ pastOrders }) => {
    return (
        <>
            {
                pastOrders?.map((order) => (
                    <>
                        <div className='flex justify-between mx-20 my-6 bg-white shadow-md rounded-md font-poppins'>
                            <div className='flex flex-col m-4 p-2 gap-y-3'>
                                <div className='font-semibold text-lg'>
                                    ID : {order?.paymentId?.orderId}
                                    {/* //Change this to payment order id */}
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
                            <div className='flex flex-col m-4 gap-y-2 mr-8'>
                                <label htmlFor="status" className='text-sm'>
                                    Status
                                </label>
                                <p className='text-neutral-500'>
                                    delivered
                                </p>

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

    const currentOrders = orders.filter((order) => order.orderStatus !== 'delivered');
    const pastOrders = orders.filter((order) => order.orderStatus === 'delivered');


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