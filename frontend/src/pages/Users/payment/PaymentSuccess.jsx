import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../../redux/slices/cartSlice';
import axios from 'axios';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('orderId');
  const transactionNo = searchParams.get('transactionNo');

  useEffect(() => {
    const createOrderFromVNPay = async () => {
      try {
        // Check if already processing this order
        const processingKey = `processing_${orderId}`;
        if (sessionStorage.getItem(processingKey)) {
          console.log('Order already being processed');
          setLoading(false);
          return;
        }

        // Get pending order from session storage
        const pendingOrderData = sessionStorage.getItem('pendingOrder');

        if (!pendingOrderData) {
          setLoading(false);
          return;
        }

        // Set processing flag immediately
        sessionStorage.setItem(processingKey, 'true');

        const orderData = JSON.parse(pendingOrderData);
        const amount = searchParams.get('amount');
        const payDate = searchParams.get('payDate');
        const secureHash = searchParams.get('secureHash');

        // Step 1: Verify payment and create payment record
        const verifyResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/payment/vnpay/verify-and-create`,
          {
            orderId,
            transactionNo,
            amount,
            payDate,
            secureHash,
            ownerId: orderData.userId,
            orderItems: orderData.orderItems,
            useraddress: orderData.deliveryAddress
          },
          { withCredentials: true }
        );

        if (verifyResponse.data.success) {
          // Step 2: Create order with payment ID
          const fullOrderData = {
            ...orderData,
            paymentId: verifyResponse.data.paymentId
          };

          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/order/newOrder`,
            fullOrderData,
            { withCredentials: true }
          );

          // Clear cart and session storage
          dispatch(clearCart({ userId: orderData.userId }));
          sessionStorage.removeItem('pendingOrder');
          // Keep processing flag to prevent reprocessing

          setLoading(false);
        }
      } catch (err) {
        console.error('Error creating order:', err);
        setError('Failed to create order');
        setLoading(false);
      }
    };

    if (orderId && transactionNo) {
      createOrderFromVNPay();
    } else {
      setLoading(false);
    }
  }, [orderId, transactionNo, dispatch, searchParams]);

  const handleViewOrders = () => {
    navigate('/UsersOrders');
  };

  const handleBackToHome = () => {
    navigate('/UsersRestaurant');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý thanh toán của bạn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToHome}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Thanh Toán Thành Công!</h2>
          <p className="text-gray-600">Cảm ơn bạn đã đặt hàng</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 font-semibold">Mã đơn hàng:</span>
            <span className="text-gray-800">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-semibold">Mã giao dịch:</span>
            <span className="text-gray-800">{transactionNo}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleViewOrders}
            className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition duration-300 font-semibold shadow-lg"
          >
            Xem Đơn Hàng
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
          >
            Về Trang Chủ
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Bạn sẽ nhận được email xác nhận trong giây lát.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

