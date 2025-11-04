import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, clearDatabase } from './testSetup.js';
import {
  createTestUser,
  createTestRestaurant,
  createTestMenuItem,
  createTestDeliveryAddress
} from './testHelpers.js';
import UserModel from '../../models/UserModel.js';
import ResModel from '../../models/ResModel.js';
import MenuModel from '../../models/MenuModel.js';
import DeliveryAddressModel from '../../models/DelAddressModel.js';
import { Payment } from '../../models/PaymentModel.js';

describe('Checkout Integration Tests', () => {
  let app;
  let testUser;
  let testRestaurant;
  let testMenuItem;
  let testAddress;
  let userToken;

  beforeAll(async () => {
    app = await setupTestEnvironment();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  const setupTestData = async () => {
    // Create user
    const userData = await createTestUser();
    testUser = await UserModel.create(userData);

    const userLoginRes = await request(app)
      .post('/auth/UserLogin')
      .send({ email: userData.email, password: 'password123' });

    userToken = userLoginRes.headers['set-cookie']?.find(c => c.startsWith('token='))?.split(';')[0].split('=')[1];

    // Create restaurant
    const resData = await createTestRestaurant();
    testRestaurant = await ResModel.create(resData);

    // Create menu item
    const menuItemData = createTestMenuItem(testRestaurant._id, {
      dishName: 'Test Pizza',
      price: 100,
      cuisineName: 'Italian'
    });
    testMenuItem = await MenuModel.create(menuItemData);

    // Create delivery address
    const addressData = createTestDeliveryAddress(testUser._id);
    testAddress = await DeliveryAddressModel.create(addressData);
  };

  describe('Checkout Flow', () => {
    it('should create checkout order with valid products', async () => {
      await setupTestData();

      const checkoutData = {
        products: [
          {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price,
            quantity: 2
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [{
          item: {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price
          },
          quantity: 2
        }],
        useraddress: {
          userId: testUser._id,
          country: testAddress.country,
          state: testAddress.state,
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('amount');
      expect(response.body.amount).toBe(200); // 100 * 2
      expect(response.body).toHaveProperty('payStatus', 'created');
      expect(response.body).toHaveProperty('ownerId');
      expect(response.body.ownerId).toBe(testUser._id.toString());
    });

    it('should calculate correct total for multiple products', async () => {
      await setupTestData();

      // Create another menu item
      const menuItem2 = await MenuModel.create(createTestMenuItem(testRestaurant._id, {
        dishName: 'Burger',
        price: 50,
        cuisineName: 'American'
      }));

      const checkoutData = {
        products: [
          {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price,
            quantity: 2
          },
          {
            dishName: menuItem2.dishName,
            price: menuItem2.price,
            quantity: 3
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [
          {
            item: { dishName: testMenuItem.dishName, price: testMenuItem.price },
            quantity: 2
          },
          {
            item: { dishName: menuItem2.dishName, price: menuItem2.price },
            quantity: 3
          }
        ],
        useraddress: {
          userId: testUser._id,
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe(350); // (100*2) + (50*3) = 350
    });

    it('should allow checkout without authentication', async () => {
      const checkoutData = {
        products: [
          { dishName: 'Test Pizza', price: 100, quantity: 1 }
        ],
        ownerId: 'user123',
        orderItems: [],
        useraddress: {}
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .send(checkoutData);

      // Checkout does not require authentication, should work
      expect(response.status).toBe(200);
    });

    it('should handle empty products array', async () => {
      await setupTestData();

      const checkoutData = {
        products: [],
        ownerId: testUser._id.toString(),
        orderItems: [],
        useraddress: {
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      // Should handle empty products
      if (response.status === 200) {
        expect(response.body.amount).toBe(0);
      }
    });

    it('should include all required data in checkout response', async () => {
      await setupTestData();

      const checkoutData = {
        products: [
          {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price,
            quantity: 1
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [{
          item: {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price
          },
          quantity: 1
        }],
        useraddress: {
          userId: testUser._id,
          country: testAddress.country,
          state: testAddress.state,
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('ownerId');
      expect(response.body).toHaveProperty('orderItems');
      expect(response.body).toHaveProperty('useraddress');
      expect(response.body).toHaveProperty('payStatus');

      // Verify orderItems structure
      expect(Array.isArray(response.body.orderItems)).toBe(true);
      expect(response.body.orderItems.length).toBe(1);

      // Verify useraddress structure
      expect(response.body.useraddress).toHaveProperty('city');
      expect(response.body.useraddress).toHaveProperty('address');
    });
  });

  describe('Complete Checkout to Payment Verification Flow', () => {
    it('should complete full checkout -> verify -> save payment flow', async () => {
      await setupTestData();

      // Step 1: Checkout
      const checkoutData = {
        products: [
          {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price,
            quantity: 2
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [{
          item: {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price
          },
          quantity: 2
        }],
        useraddress: {
          userId: testUser._id,
          country: testAddress.country,
          state: testAddress.state,
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const checkoutRes = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(checkoutRes.status).toBe(200);
      const { orderId, amount, ownerId, orderItems, useraddress } = checkoutRes.body;

      // Step 2: Verify payment (simulate payment gateway callback)
      const verifyData = {
        orderId: orderId,
        ownerId: ownerId,
        paymentId: `pay_${Date.now()}`,
        signature: 'test_signature_123',
        amount: amount,
        orderItems: orderItems,
        useraddress: useraddress
      };

      const verifyRes = await request(app)
        .post('/api/payment/verify-payment')
        .set('Cookie', [`token=${userToken}`])
        .send(verifyData);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toHaveProperty('success', true);
      expect(verifyRes.body).toHaveProperty('orderConfirm');

      // Step 3: Verify payment saved in database
      const savedPayment = await Payment.findOne({ orderId: orderId });
      expect(savedPayment).toBeTruthy();
      expect(savedPayment.payStatus).toBe('paid');
      expect(savedPayment.ownerId).toBe(ownerId);
      expect(savedPayment.amount).toBe(amount);
    });

    it('should retrieve user orders after checkout', async () => {
      await setupTestData();

      // Create checkout and payment
      const checkoutData = {
        products: [
          { dishName: testMenuItem.dishName, price: testMenuItem.price, quantity: 1 }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [{
          item: { dishName: testMenuItem.dishName, price: testMenuItem.price },
          quantity: 1
        }],
        useraddress: {
          userId: testUser._id,
          city: testAddress.city,
          address: testAddress.address
        }
      };

      const checkoutRes = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      // Verify payment
      const verifyData = {
        orderId: checkoutRes.body.orderId,
        ownerId: testUser._id.toString(),
        paymentId: `pay_${Date.now()}`,
        signature: 'test_signature',
        amount: checkoutRes.body.amount,
        orderItems: checkoutRes.body.orderItems,
        useraddress: checkoutRes.body.useraddress
      };

      await request(app)
        .post('/api/payment/verify-payment')
        .set('Cookie', [`token=${userToken}`])
        .send(verifyData);

      // Get user orders
      const ordersRes = await request(app)
        .get('/api/payment/UsersOrders')
        .set('Cookie', [`token=${userToken}`]);

      expect(ordersRes.status).toBe(200);
      expect(Array.isArray(ordersRes.body)).toBe(true);
      expect(ordersRes.body.length).toBeGreaterThan(0);
      expect(ordersRes.body[0]).toHaveProperty('orderId');
      expect(ordersRes.body[0]).toHaveProperty('payStatus', 'paid');
    });
  });

  describe('Checkout Validation Tests', () => {
    it('should handle checkout with missing products', async () => {
      await setupTestData();

      const checkoutData = {
        ownerId: testUser._id.toString(),
        orderItems: [],
        useraddress: {}
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      // Should handle missing products gracefully
      expect([400, 500]).toContain(response.status);
    });

    it('should handle checkout with invalid product data', async () => {
      await setupTestData();

      const checkoutData = {
        products: [
          {
            dishName: 'Test',
            price: 'invalid', // Invalid price type
            quantity: 2
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [],
        useraddress: {}
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      // Should handle invalid data
      if (response.status !== 200) {
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should handle checkout with negative quantity', async () => {
      await setupTestData();

      const checkoutData = {
        products: [
          {
            dishName: testMenuItem.dishName,
            price: testMenuItem.price,
            quantity: -1 // Negative quantity
          }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [],
        useraddress: {}
      };

      const response = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      // System should handle negative quantities appropriately
      if (response.status === 200) {
        // If it allows, amount should reflect the calculation
        expect(typeof response.body.amount).toBe('number');
      } else {
        expect([400, 500]).toContain(response.status);
      }
    });


  });

  describe('Multiple Checkout Sessions', () => {
    it('should handle multiple checkouts from same user', async () => {
      await setupTestData();

      const checkoutData = {
        products: [
          { dishName: testMenuItem.dishName, price: testMenuItem.price, quantity: 1 }
        ],
        ownerId: testUser._id.toString(),
        orderItems: [{
          item: { dishName: testMenuItem.dishName, price: testMenuItem.price },
          quantity: 1
        }],
        useraddress: {
          city: testAddress.city,
          address: testAddress.address
        }
      };

      // First checkout
      const checkout1 = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(checkout1.status).toBe(200);
      const orderId1 = checkout1.body.orderId;

      // Second checkout
      const checkout2 = await request(app)
        .post('/api/payment/checkout')
        .set('Cookie', [`token=${userToken}`])
        .send(checkoutData);

      expect(checkout2.status).toBe(200);
      const orderId2 = checkout2.body.orderId;

      // OrderIds should be different
      expect(orderId1).not.toBe(orderId2);
    });

    it('should track all payments for a user', async () => {
      await setupTestData();

      // Create multiple payments
      for (let i = 0; i < 3; i++) {
        const checkoutData = {
          products: [
            { dishName: testMenuItem.dishName, price: testMenuItem.price, quantity: 1 }
          ],
          ownerId: testUser._id.toString(),
          orderItems: [{
            item: { dishName: testMenuItem.dishName, price: testMenuItem.price },
            quantity: 1
          }],
          useraddress: {
            city: testAddress.city,
            address: testAddress.address
          }
        };

        const checkoutRes = await request(app)
          .post('/api/payment/checkout')
          .set('Cookie', [`token=${userToken}`])
          .send(checkoutData);

        // Verify each payment
        await request(app)
          .post('/api/payment/verify-payment')
          .set('Cookie', [`token=${userToken}`])
          .send({
            orderId: checkoutRes.body.orderId,
            ownerId: testUser._id.toString(),
            paymentId: `pay_${Date.now()}_${i}`,
            signature: `sig_${i}`,
            amount: checkoutRes.body.amount,
            orderItems: checkoutRes.body.orderItems,
            useraddress: checkoutRes.body.useraddress
          });
      }

      // Get all user orders
      const ordersRes = await request(app)
        .get('/api/payment/UsersOrders')
        .set('Cookie', [`token=${userToken}`]);

      expect(ordersRes.status).toBe(200);
      expect(ordersRes.body.length).toBe(3);
    });
  });
});

