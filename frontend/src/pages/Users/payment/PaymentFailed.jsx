import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get('code');

  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Giao dịch bị nghi ngờ là gian lận',
      '09': 'Thẻ chưa đăng ký dịch vụ Internet Banking',
      '10': 'Khách hàng nhập sai thông tin xác thực quá 3 lần',
      '11': 'Giao dịch đã quá thời gian chờ thanh toán. Vui lòng thực hiện lại giao dịch',
      '12': 'Thẻ bị khóa',
      '13': 'Khách hàng nhập sai mật khẩu OTP',
      '24': 'Khách hàng đã hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
    };
    return errorMessages[code] || 'Thanh toán thất bại. Vui lòng thử lại.';
  };

  const handleTryAgain = () => {
    navigate('/UsersCart');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Thanh Toán Thất Bại</h2>
          <p className="text-gray-600">Không thể xử lý thanh toán của bạn</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-800 font-semibold mb-1">Mã lỗi: {errorCode || 'Không xác định'}</p>
          <p className="text-red-700 text-sm">{getErrorMessage(errorCode)}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition duration-300 font-semibold shadow-lg"
          >
            Thử Lại
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
          >
            Về Trang Chủ
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;

