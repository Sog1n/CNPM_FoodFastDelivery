import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/AfterLoginUsersComp/usersNavbar';
import { useDispatch, useSelector } from 'react-redux';
import { MdDelete, MdEdit } from "react-icons/md";
import { clearCart, decrementQuantity, incrementQuantity, removeFromCart } from '../../../redux/slices/cartSlice';
import { useNavigate } from "react-router-dom";
import AddressPopup from './AddressPopup';
import axios from 'axios';

const UsersCart = () => {
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [showCartTotal, setShowCartTotal] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddress, setUserAddress] = useState([]);
  const restaurant = useSelector(state => state.activeRestaurant.activeRestaurant);


  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId');
  const cartItems = useSelector(state => state.cart.cartItems.filter(cartItem => cartItem.userId == userId));

  // Create new order
  const createOrder = async (orderData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/order/newOrder`, orderData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response.status === 200) {
        console.log('Order created successfully');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order');
    }
  }


  //Fetch users addresses
  const fetchUserAddresses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/addresses/deliveryaddress/${userId}`,
        {
          withCredentials: true  // Important: Send cookies with request
        }
      );
      console.log(response.data);
      if (response.status === 200) {
        setUserAddress(response.data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      setError('Failed to fetch address');
    }
  }
  useEffect(() => {
    fetchUserAddresses();
  }
    , []);



  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setShowCartTotal(true);
    setShowAddressPopup(false);
    setIsEditing(false);
  };

  const calculateTotal = (item) => item.price * item.quantity;
  const cartTotal = cartItems.reduce((total, item) => total + calculateTotal(item), 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRemoveItem = (_id) => {
    dispatch(removeFromCart({ _id: _id, userId: userId }));
  };

  const handleDeliveryAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/addresses/deliveryaddress`, {
        address,
        country,
        state,
        city,
      });
      console.log(response);
      setShowCartTotal(true);
      setShowAddressPopup(false);
      setIsEditing(false);
      fetchUserAddresses();
    } catch (err) {
      if (err.response) {
        console.error(err.response.data);
        console.error(err.response.status);
        setError(err.response.data.error);
      } else {
        console.error(err);
      }
    }
  };

  const handlePayment = async () => {
    try {
      const body = { products: cartItems };
      const headers = { "Content-Type": "application/json" };


      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/checkout`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const orderResponse = await response.json();
      const { orderId, amount: orderAmount } = orderResponse;

      var options = {
        key: "rzp_test_Jp05EcVr7cQRf3", // Enter the Key ID generated from the Dashboard
        amount: orderAmount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: "USD",
        name: "Foodiebuddy",
        description: "Food delivery website",
        order_id: orderId, // This is a sample Order ID. Pass the id obtained in the response of Step 1
        handler: async function (response) {
          const paymentData = {
            orderId: response.razorpay_order_id,
            ownerId: userId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amount: orderAmount,
            orderItems: cartItems,
            quantity: cartItems.reduce((total, item) => total + item.quantity, 0), // calculate total quantity
          };

          // Make a request to your backend to verify the payment and update the order status
          const api = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify-payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
          });

          const apiResponse = await api.json();
          console.log("razorpay res ", apiResponse);
          if (apiResponse.success) {
            const orderData = {
              orderItems: cartItems.map((item) => (
                { item: {dishName:item.dishName,price:item.price}, 
                quantity: item.quantity })),
              totalAmount: orderAmount,
              paymentId: apiResponse.orderConfirm._id,
              deliveryAddress: selectedAddress,
              restaurant: restaurant,
            };
            await createOrder(orderData);
            dispatch(clearCart({ userId: userId }));
            navigate("/UsersOrders");
          } else {
            console.error("Payment verification failed");
          }
        },
        prefill: {
          name: "Bhoomi verma",
          email: "vbhoomi1024@gmail.com",
          contact: "9170302787",
        },
        notes: {
          address: "krishna nagar",
        },
        theme: {
          color: "#3399cc",
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      console.log("Order response:", orderResponse);
    } catch (error) {
      console.error("Payment error:", error);
    }
  };


  const handleEditAddress = () => {
    setIsEditing(true);
    setShowAddressPopup(true);
  };



  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-2/3">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-center">Title</th>
                  <th className="border p-3 text-center">Price</th>
                  <th className="border p-3 text-center">Quantity</th>
                  <th className="border p-3 text-center">Total</th>
                  <th className="border p-3 text-center">Remove item</th>
                </tr>
              </thead>
              <tbody className='text-center'>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="border p-3">{item.dishName}</td>
                    <td className="border p-3">Rs. {item.price.toFixed(2)}</td>
                    <td className="flex justify-center border p-3">
                      <button
                        onClick={() => {
                          dispatch(decrementQuantity({ _id: item._id, userId: userId }));
                        }}
                        className="px-3 py-2 text-red-500 hover:text-red-600 transition-colors duration-300 focus:outline-none"
                      >
                        <svg className="w-5 h-5 " fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M20 12H4"></path>
                        </svg>
                      </button>
                      <p className="px-3 py-2 font-semibold text-gray-800 bg-neutral-200 rounded-sm">{item.quantity}</p>
                      <button
                        onClick={() => {
                          dispatch(incrementQuantity({ _id: item._id, userId: userId }));
                        }}
                        className="px-3 py-2 text-green-500 hover:text-green-600 transition-colors duration-300 focus:outline-none"
                      >
                        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </button>
                    </td>
                    <td className="border p-3">Rs. {calculateTotal(item).toFixed(2)}</td>
                    <td className="border p-3">
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-neutral-800 hover:text-neutral-950 transition duration-300">
                        <span >
                          <MdDelete size={24} />
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:w-1/3">

          {/* //Display user addresses */}
           {/* //Display user addresses */}
           {
              userAddress.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <div className="flex flex-col mb-4 gap-y-2">
                    <h2 className="text-xl font-semibold">Select any delivery Address</h2>
                    {userAddress.map((address) => (
                      <div key={address._id} className="flex gap-x-2 items-center mb-4">
                        <div>
                          <input type="radio" name="address"
                            className='size-5'
                            onClick={() => {
                              setAddress(address.address);
                              setCountry(address.country);
                              setState(address.state);
                              setCity(address.city);
                              setShowCartTotal(true);
                              setSelectedAddress(address._id);
                            }}
                          />
                        </div>
                        <p className="mb-4 p-3 bg-white rounded shadow ">
                          {address.country}, {address.state}, {address.city}, {address.address}
                        </p>

                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <button
                onClick={() => setShowAddressPopup(true)}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-300"
              >
                Enter New Delivery Address
              </button>
            </div>

              {/*Show cart total only if user has selected an address and let them proceed to payment */}
            {showCartTotal && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                {/* We need to move this button */}
                {/* <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                  <button
                    onClick={handleEditAddress}
                    className="text-yellow-500 hover:text-yellow-600 transition duration-300"
                  >
                    <MdEdit size={24} />
                  </button>
                </div> */}
                <p className="mb-4 p-3 bg-white rounded shadow">
                  {country}, {state}, {city}, {address}
                </p>
                <h2 className="text-xl font-semibold mb-4">Cart Totals</h2>
                <p className="mb-4">Total: $ {cartTotal.toFixed(2)}</p>
                <button
                  className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-300"
                  onClick={handlePayment}
                >
                  Proceed to Payment
                </button>
              </div>
            ) }
          </div>
        </div>
      </div>

      <AddressPopup
        showAddressPopup={showAddressPopup}
        isEditing={isEditing}
        address={address}
        setAddress={setAddress}
        country={country}
        setCountry={setCountry}
        state={state}
        setState={setState}
        city={city}
        setCity={setCity}
        handleAddressSubmit={handleDeliveryAddress}
        setShowAddressPopup={setShowAddressPopup}
        setIsEditing={setIsEditing}
      />
    </>
  );
};

export default UsersCart;