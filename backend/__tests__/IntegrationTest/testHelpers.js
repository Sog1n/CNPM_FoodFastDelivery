import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * Helper functions for integration tests
 */

// Generate JWT tokens for different user types
export const generateToken = (userId, type = 'user') => {
  return jwt.sign({ id: userId }, process.env.KEY || 'test-key', {
    expiresIn: '1d'
  });
};

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Create test user data
export const createTestUser = async (overrides = {}) => {
  return {
    ownerName: 'Test User',
    email: `testuser_${Date.now()}@test.com`,
    password: await hashPassword('password123'),
    phone: `012345${Date.now().toString().slice(-4)}`,
    ...overrides
  };
};

// Create test restaurant data
export const createTestRestaurant = async (overrides = {}) => {
  return {
    restaurantName: 'Test Restaurant',
    ownerName: 'Restaurant Owner',
    email: `testres_${Date.now()}@test.com`,
    password: await hashPassword('password123'),
    address: '123 Test Street',
    phone: `098765${Date.now().toString().slice(-4)}`,
    city: 'Ho Chi Minh',
    countryName: 'Vietnam',
    stateName: 'HCM',
    ...overrides
  };
};

// Create test delivery partner data
export const createTestDelivery = async (overrides = {}) => {
  return {
    ownerName: 'Test Delivery Partner',
    email: `testdel_${Date.now()}@test.com`,
    password: await hashPassword('password123'),
    phone: `011111${Date.now().toString().slice(-4)}`,
    drivingLicenceNo: `DL${Date.now()}`,
    address: '456 Delivery Street',
    city: 'Ho Chi Minh',
    countryName: 'Vietnam',
    stateName: 'HCM',
    ...overrides
  };
};

// Create test menu item data
export const createTestMenuItem = (restaurantId, overrides = {}) => {
  return {
    dishName: 'Test Pizza',
    description: 'Delicious test pizza',
    price: 15.99,
    cuisineName: 'Italian',
    ownerId: restaurantId,
    image: 'https://example.com/pizza.jpg',
    inStock: true,
    ...overrides
  };
};

// Create test order data
export const createTestOrder = (userId, restaurantId, overrides = {}) => {
  return {
    user: userId,
    restaurant: restaurantId,
    paymentId: `PAY_${Date.now()}`,
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Test City',
      zipCode: '12345',
      coordinates: {
        lat: 10.762622,
        lng: 106.660172
      }
    },
    orderItems: [
      {
        menuItem: 'menuItemId',
        name: 'Test Pizza',
        quantity: 2,
        price: 15.99
      }
    ],
    totalAmount: 31.98,
    orderStatus: 'pending',
    ...overrides
  };
};

// Create test drone data
export const createTestDrone = (overrides = {}) => {
  return {
    name: `Drone_${Date.now()}`,
    model: 'DJI-Test',
    status: 'AVAILABLE',
    batteryLevel: 100,
    maxPayload: 5,
    currentLocation: {
      lat: 10.762622,
      lng: 106.660172
    },
    ...overrides
  };
};

// Wait for async operations
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clean test data helper
export const cleanDatabase = async (models) => {
  for (const model of models) {
    if (model && model.deleteMany) {
      await model.deleteMany({});
    }
  }
};

// Create payment data
export const createTestPayment = (overrides = {}) => {
  return {
    orderDate: new Date(),
    payStatus: 'completed',
    paymentMethod: 'VNPay',
    paymentDate: new Date().toISOString(),
    ...overrides
  };
};

// Create test delivery address data
export const createTestDeliveryAddress = (userId, overrides = {}) => {
  return {
    userId: userId,
    country: 'Vietnam',
    state: 'Ho Chi Minh',
    city: 'Ho Chi Minh',
    address: '123 Test Street, District 1',
    ...overrides
  };
};

// Mock VNPay response
export const mockVNPayCallback = (txnRef, success = true) => {
  const vnp_SecureHash = 'test_secure_hash';
  return {
    vnp_Amount: '3198000',
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: 'VNP123456',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: 'Payment for order',
    vnp_PayDate: '20251105120000',
    vnp_ResponseCode: success ? '00' : '01',
    vnp_TmnCode: 'TEST_TMN',
    vnp_TransactionNo: '123456789',
    vnp_TxnRef: txnRef,
    vnp_SecureHash: vnp_SecureHash
  };
};

// Validate response structure
export const expectValidOrderResponse = (order) => {
  expect(order).toHaveProperty('_id');
  expect(order).toHaveProperty('user');
  expect(order).toHaveProperty('restaurant');
  expect(order).toHaveProperty('orderStatus');
  expect(order).toHaveProperty('totalAmount');
  expect(order).toHaveProperty('orderItems');
};

export const expectValidPaymentResponse = (payment) => {
  expect(payment).toHaveProperty('_id');
  expect(payment).toHaveProperty('amount');
  expect(payment).toHaveProperty('status');
  expect(payment).toHaveProperty('paymentMethod');
};

// Extract cookies from response
export const extractCookies = (response) => {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return null;

  const cookieMap = {};
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookieMap[name] = value;
  });

  return cookieMap;
};

// Create authenticated request headers
export const createAuthHeaders = (token) => {
  return {
    'Cookie': [`token=${token}`]
  };
};

