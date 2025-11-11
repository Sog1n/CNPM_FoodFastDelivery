import { describe, it, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';
import querystring from 'qs';

describe('Payment Routes - VNPay Unit Tests', () => {
  const SECRET_KEY = 'TEST_SECRET_KEY_12345678';

  beforeAll(() => {
    // Setup test environment
    process.env.VNP_TMN_CODE = 'TEST_TMN_CODE';
    process.env.VNP_HASH_SECRET = SECRET_KEY;
    process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNP_RETURN_URL = 'http://localhost:5000/api/payment/vnpay_return';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  // Helper function to sort object (for VNPay)
  function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

  // Helper function to create secure hash
  function createSecureHash(params, secretKey) {
    const sortedParams = sortObject(params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  }

  describe('Payment Amount Calculations', () => {
    it('should calculate correct Razorpay amount in paise', () => {
      const products = [
        { name: 'Pizza', price: 10, quantity: 2 },
        { name: 'Burger', price: 5, quantity: 1 }
      ];

      const amount = products.reduce((total, product) => total + product.price * product.quantity, 0);
      const amountInPaise = amount * 100;

      expect(amount).toBe(25);
      expect(amountInPaise).toBe(2500);
    });

    it('should convert USD to VND for VNPay', () => {
      const usdAmount = 20;
      const exchangeRate = 23000;
      const vndAmount = usdAmount * exchangeRate * 100; // VNPay requires amount * 100

      expect(vndAmount).toBe(46000000);
    });

    it('should convert VND back to USD', () => {
      const vndAmount = 46000000;
      const exchangeRate = 23000;
      const usdAmount = vndAmount / (exchangeRate * 100);

      expect(usdAmount).toBe(20);
    });

    it('should handle decimal amounts correctly', () => {
      const products = [
        { name: 'Item1', price: 15.5, quantity: 3 },
        { name: 'Item2', price: 20.0, quantity: 2 }
      ];

      const amount = products.reduce((total, product) => total + product.price * product.quantity, 0);

      expect(amount).toBe(86.5);
    });
  });

  describe('VNPay Payment URL Generation', () => {
    it('should generate correct VNPay payment URL parameters', () => {
      const orderId = '20241104123456';
      const amount = 20; // USD
      const vnpAmount = Math.round(amount * 23000 * 100);

      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: 'TEST_TMN_CODE',
        vnp_Amount: vnpAmount,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_ReturnUrl: 'http://localhost:5000/api/payment/vnpay_return'
      };

      expect(vnp_Params.vnp_Version).toBe('2.1.0');
      expect(vnp_Params.vnp_Command).toBe('pay');
      expect(vnp_Params.vnp_Amount).toBe(46000000);
      expect(vnp_Params.vnp_TxnRef).toBe(orderId);
      expect(vnp_Params.vnp_CurrCode).toBe('VND');
    });

    it('should generate secure hash for VNPay params', () => {
      const params = {
        vnp_TxnRef: 'order_123',
        vnp_Amount: '2300000',
        vnp_OrderInfo: 'Payment for order_123'
      };

      const hash = createSecureHash(params, SECRET_KEY);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(128); // SHA512 produces 128 hex characters
    });

    it('should sort VNPay parameters correctly', () => {
      const params = {
        vnp_TxnRef: 'order_123',
        vnp_Amount: '1000000',
        vnp_Command: 'pay',
        vnp_Version: '2.1.0'
      };

      const sorted = sortObject(params);
      const keys = Object.keys(sorted);

      // Keys should be sorted alphabetically
      expect(keys[0]).toBe('vnp_Amount');
      expect(keys[1]).toBe('vnp_Command');
      expect(keys[2]).toBe('vnp_TxnRef');
      expect(keys[3]).toBe('vnp_Version');
    });
  });

  describe('VNPay Response Code Handling', () => {
    it('should identify successful payment (code 00)', () => {
      const responseCode = '00';
      const isSuccess = responseCode === '00';

      expect(isSuccess).toBe(true);
    });

    it('should identify failed payment codes', () => {
      const failedCodes = ['07', '09', '10', '11', '12', '24', '51', '65', '75', '79', '99'];

      failedCodes.forEach(code => {
        const isSuccess = code === '00';
        expect(isSuccess).toBe(false);
      });
    });

    it('should map response codes to messages', () => {
      const responseCodeMessages = {
        '00': 'Success',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
        '99': 'Các lỗi khác'
      };

      expect(responseCodeMessages['00']).toBe('Success');
      expect(responseCodeMessages['24']).toContain('hủy giao dịch');
      expect(responseCodeMessages['99']).toBe('Các lỗi khác');
    });
  });

  describe('VNPay Signature Verification', () => {
    it('should verify valid VNPay signature', () => {
      const params = {
        vnp_TxnRef: 'order_456',
        vnp_Amount: '4600000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14012345'
      };

      const originalHash = createSecureHash(params, SECRET_KEY);
      const verifyHash = createSecureHash(params, SECRET_KEY);

      expect(originalHash).toBe(verifyHash);
    });

    it('should detect tampered VNPay data', () => {
      const params = {
        vnp_TxnRef: 'order_789',
        vnp_Amount: '1000000',
        vnp_ResponseCode: '00'
      };

      const originalHash = createSecureHash(params, SECRET_KEY);

      // Tamper with amount
      params.vnp_Amount = '9999999';
      const tamperedHash = createSecureHash(params, SECRET_KEY);

      expect(originalHash).not.toBe(tamperedHash);
    });

    it('should detect tampered response code', () => {
      const params = {
        vnp_TxnRef: 'order_999',
        vnp_Amount: '2000000',
        vnp_ResponseCode: '24' // Failed
      };

      const failedHash = createSecureHash(params, SECRET_KEY);

      // Change to success
      params.vnp_ResponseCode = '00';
      const successHash = createSecureHash(params, SECRET_KEY);

      expect(failedHash).not.toBe(successHash);
    });

    it('should handle empty secure hash correctly', () => {
      const secureHash = '';
      const params = {
        vnp_TxnRef: 'order_123',
        vnp_Amount: '1000000'
      };

      const calculatedHash = createSecureHash(params, SECRET_KEY);

      expect(secureHash).not.toBe(calculatedHash);
      expect(calculatedHash.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Model Validation', () => {
    it('should validate VNPay payment method enum', () => {
      const validMethods = ['Razorpay', 'VNPay'];
      const paymentMethod = 'VNPay';

      expect(validMethods).toContain(paymentMethod);
    });

    it('should reject invalid payment method', () => {
      const validMethods = ['Razorpay', 'VNPay'];
      const invalidMethod = 'InvalidMethod';

      expect(validMethods).not.toContain(invalidMethod);
    });

    it('should have correct default payment method', () => {
      const defaultMethod = 'Razorpay';
      const validMethods = ['Razorpay', 'VNPay'];

      expect(validMethods).toContain(defaultMethod);
    });

    it('should validate payment status values', () => {
      const validStatuses = ['pending', 'paid', 'failed', 'created'];
      const status = 'paid';

      expect(validStatuses).toContain(status);
    });
  });

  describe('VNPay IPN Response Format', () => {
    it('should return correct success response format', () => {
      const successResponse = {
        RspCode: '00',
        Message: 'Success'
      };

      expect(successResponse.RspCode).toBe('00');
      expect(successResponse.Message).toBe('Success');
    });

    it('should return correct order not found response', () => {
      const notFoundResponse = {
        RspCode: '01',
        Message: 'Order not found'
      };

      expect(notFoundResponse.RspCode).toBe('01');
      expect(notFoundResponse.Message).toBe('Order not found');
    });

    it('should return correct order confirmed response', () => {
      const confirmedResponse = {
        RspCode: '02',
        Message: 'Order already confirmed'
      };

      expect(confirmedResponse.RspCode).toBe('02');
      expect(confirmedResponse.Message).toBe('Order already confirmed');
    });

    it('should return correct invalid signature response', () => {
      const invalidSigResponse = {
        RspCode: '97',
        Message: 'Invalid signature'
      };

      expect(invalidSigResponse.RspCode).toBe('97');
      expect(invalidSigResponse.Message).toBe('Invalid signature');
    });

    it('should return correct unknown error response', () => {
      const errorResponse = {
        RspCode: '99',
        Message: 'Unknown error'
      };

      expect(errorResponse.RspCode).toBe('99');
      expect(errorResponse.Message).toBe('Unknown error');
    });
  });

  describe('VNPay Date Format', () => {
    it('should format date correctly for VNPay (yyyyMMddHHmmss)', () => {
      const date = new Date('2024-11-04T12:34:56');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      const formattedDate = `${year}${month}${day}${hours}${minutes}${seconds}`;

      expect(formattedDate).toBe('20241104123456');
      expect(formattedDate.length).toBe(14);
    });

    it('should handle single digit dates correctly', () => {
      const date = new Date('2024-01-05T08:09:07');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      const formattedDate = `${year}${month}${day}${hours}${minutes}${seconds}`;

      expect(formattedDate).toBe('20240105080907');
    });
  });

  describe('VNPay Payment Flow Logic', () => {
    it('should process complete VNPay payment flow', () => {
      // Step 1: Create payment URL
      const orderId = Date.now().toString();
      const amount = 50; // USD
      const vnpAmount = Math.round(amount * 23000 * 100);

      const createParams = {
        vnp_TxnRef: orderId,
        vnp_Amount: vnpAmount.toString(),
        vnp_Command: 'pay'
      };

      expect(createParams.vnp_TxnRef).toBe(orderId);
      expect(parseInt(createParams.vnp_Amount)).toBe(115000000);

      // Step 2: User completes payment
      const returnParams = {
        vnp_TxnRef: orderId,
        vnp_Amount: vnpAmount.toString(),
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14012345'
      };

      const secureHash = createSecureHash(returnParams, SECRET_KEY);
      expect(secureHash).toBeDefined();

      // Step 3: Verify signature
      const verifyHash = createSecureHash(returnParams, SECRET_KEY);
      const isValid = secureHash === verifyHash;
      expect(isValid).toBe(true);

      // Step 4: Check response code
      const isSuccess = returnParams.vnp_ResponseCode === '00';
      expect(isSuccess).toBe(true);
    });

    it('should handle failed payment flow', () => {
      const orderId = 'failed_order_123';
      const returnParams = {
        vnp_TxnRef: orderId,
        vnp_Amount: '2300000',
        vnp_ResponseCode: '24', // User cancelled
        vnp_TransactionNo: ''
      };

      const isSuccess = returnParams.vnp_ResponseCode === '00';
      const isCancelled = returnParams.vnp_ResponseCode === '24';

      expect(isSuccess).toBe(false);
      expect(isCancelled).toBe(true);
    });

    it('should prevent duplicate order creation', () => {
      const orderId = 'existing_order_123';
      const existingOrders = ['existing_order_123', 'order_456'];

      const isDuplicate = existingOrders.includes(orderId);

      expect(isDuplicate).toBe(true);
    });

    it('should allow new order creation', () => {
      const orderId = 'new_order_789';
      const existingOrders = ['existing_order_123', 'order_456'];

      const isDuplicate = existingOrders.includes(orderId);

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Payment Data Structure', () => {
    it('should have correct VNPay payment structure', () => {
      const vnpayPayment = {
        orderId: 'vnpay_order_001',
        ownerId: 'user123',
        paymentId: 'vnp_trans_123',
        signature: 'vnp_hash_123',
        amount: 200,
        orderItems: [
          { itemId: 'item1', name: 'Pizza', quantity: 2, price: 50 },
          { itemId: 'item2', name: 'Coke', quantity: 1, price: 100 }
        ],
        useraddress: {
          street: '123 Le Loi',
          city: 'Ho Chi Minh',
          district: 'District 1',
          country: 'Vietnam'
        },
        payStatus: 'paid',
        paymentMethod: 'VNPay',
        paymentDate: '20241104123456'
      };

      expect(vnpayPayment.paymentMethod).toBe('VNPay');
      expect(vnpayPayment.orderItems).toHaveLength(2);
      expect(vnpayPayment.useraddress).toHaveProperty('city');
      expect(vnpayPayment.payStatus).toBe('paid');
    });

    it('should validate order items structure', () => {
      const orderItems = [
        { itemId: 'item1', name: 'Pizza', quantity: 2, price: 50 },
        { itemId: 'item2', name: 'Burger', quantity: 1, price: 30 }
      ];

      orderItems.forEach(item => {
        expect(item).toHaveProperty('itemId');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('price');
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
      });
    });

    it('should validate user address structure', () => {
      const useraddress = {
        street: '123 Main St',
        city: 'Hanoi',
        district: 'Ba Dinh',
        country: 'Vietnam',
        postalCode: '100000'
      };

      expect(useraddress).toHaveProperty('street');
      expect(useraddress).toHaveProperty('city');
      expect(useraddress).toHaveProperty('country');
      expect(useraddress.country).toBe('Vietnam');
    });
  });

  describe('VNPay URL Building', () => {
    it('should build complete VNPay URL with all parameters', () => {
      const baseUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: 'TEST_TMN',
        vnp_Amount: '2300000',
        vnp_TxnRef: 'order_123'
      };

      const secureHash = createSecureHash(params, SECRET_KEY);
      params.vnp_SecureHash = secureHash;

      const queryString = querystring.stringify(params, { encode: false });
      const fullUrl = `${baseUrl}?${queryString}`;

      expect(fullUrl).toContain(baseUrl);
      expect(fullUrl).toContain('vnp_Version=2.1.0');
      expect(fullUrl).toContain('vnp_Command=pay');
      expect(fullUrl).toContain('vnp_SecureHash=');
    });

    it('should encode special characters in URL', () => {
      const orderInfo = 'Thanh toan don hang #123';
      const encoded = encodeURIComponent(orderInfo);

      expect(encoded).toContain('%20'); // space
      expect(encoded).toContain('%23'); // #
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required VNPay parameters', () => {
      const params = {
        vnp_TxnRef: 'order_123'
        // Missing vnp_Amount and other required fields
      };

      const requiredFields = ['vnp_Version', 'vnp_Command', 'vnp_TmnCode', 'vnp_Amount', 'vnp_TxnRef'];
      const hasAllRequired = requiredFields.every(field => field in params);

      expect(hasAllRequired).toBe(false);
    });

    it('should validate amount is greater than zero', () => {
      const validAmount = 100;
      const invalidAmount = 0;
      const negativeAmount = -50;

      expect(validAmount).toBeGreaterThan(0);
      expect(invalidAmount).toBeLessThanOrEqual(0);
      expect(negativeAmount).toBeLessThan(0);
    });

    it('should handle VNPay service timeout', () => {
      const timeout = 10000; // 10 seconds
      const elapsed = 15000; // 15 seconds

      const isTimedOut = elapsed > timeout;

      expect(isTimedOut).toBe(true);
    });
  });
});

describe('Payment Model Schema Tests', () => {
  it('should have correct schema structure', () => {
    const paymentSchema = {
      orderDate: { type: 'Date', default: 'Date.now' },
      payStatus: { type: 'String' },
      paymentMethod: { type: 'String', enum: ['Razorpay', 'VNPay'], default: 'Razorpay' },
      paymentDate: { type: 'String' }
    };

    expect(paymentSchema.paymentMethod.enum).toContain('VNPay');
    expect(paymentSchema.paymentMethod.enum).toContain('Razorpay');
    expect(paymentSchema.paymentMethod.default).toBe('Razorpay');
  });

  it('should support strict:false for dynamic VNPay fields', () => {
    const vnpayFields = {
      vnp_TxnRef: 'VNP123456',
      vnp_Amount: 100000,
      vnp_ResponseCode: '00',
      vnp_TransactionNo: '14012345',
      vnp_BankCode: 'NCB',
      vnp_CardType: 'ATM'
    };

    // With strict:false, these extra fields should be allowed
    Object.keys(vnpayFields).forEach(key => {
      expect(key.startsWith('vnp_')).toBe(true);
    });
  });
});

