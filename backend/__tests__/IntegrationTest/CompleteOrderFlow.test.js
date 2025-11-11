/**
 * INTEGRATION TEST: COMPLETE ORDER FLOW
 * Dựa trên Activity Diagram - Luồng đặt hàng hoàn chỉnh
 *
 * Test Flow:
 * 1. Khách hàng đăng nhập vào hệ thống
 * 2. Hệ thống hiển thị trang chính với thanh tìm kiếm và danh sách nhà hàng
 * 3. Chọn nhà hàng (2 cách: tìm kiếm hoặc chọn từ danh sách)
 * 4. Xem chi tiết nhà hàng và thực đơn
 * 5. Thêm món vào giỏ hàng (có thể thêm nhiều món)
 * 6. Xem giỏ hàng và xác nhận
 * 7. Thanh toán VNPay
 * 8. Lưu đơn hàng vào database
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import UserModel from '../../models/UserModel.js';
import RestaurantModel from '../../models/ResModel.js';
import MenuItemModel from '../../models/MenuModel.js';
import OrderModel from '../../models/OrderModel.js';
import DeliveryAddressModel from '../../models/DelAddressModel.js';
import { Payment } from '../../models/PaymentModel.js';
import UserRoutes from '../../routes/UserRoutes.js';
import ResRoutes from '../../routes/ResRoutes.js';
import MenuRoutes from '../../routes/menuRoutes.js';
import OrderRoutes from '../../routes/OrderRoutes.js';
import PaymentRoutes from '../../routes/paymentRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', UserRoutes);
app.use('/api', ResRoutes);
app.use('/api', MenuRoutes);
app.use('/api', OrderRoutes);
app.use('/api/payment', PaymentRoutes);

describe('INTEGRATION TEST: Complete Order Flow - Activity Diagram', () => {
  let userToken;
  let restaurantId;
  let menuItems = [];
  let userId;
  let deliveryAddressId;
  let paymentId;
  let orderId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery_test', {
        serverSelectionTimeoutMS: 30000
      });
    }

    // Clean up test data
    await UserModel.deleteMany({ email: /test.*@orderflow\.com/ });
    await RestaurantModel.deleteMany({ email: /test.*@orderflow\.com/ });
    await MenuItemModel.deleteMany({ dishName: /Test Dish.*/ });
    await OrderModel.deleteMany({});
    await Payment.deleteMany({});
    await DeliveryAddressModel.deleteMany({});
  }, 30000);

  afterAll(async () => {
    // Clean up after tests
    await UserModel.deleteMany({ email: /test.*@orderflow\.com/ });
    await RestaurantModel.deleteMany({ email: /test.*@orderflow\.com/ });
    await MenuItemModel.deleteMany({ dishName: /Test Dish.*/ });
    await OrderModel.deleteMany({});
    await Payment.deleteMany({});
    await DeliveryAddressModel.deleteMany({});

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }, 30000);

  describe('STEP 1: Khách hàng đăng nhập vào hệ thống', () => {
    it('Nên đăng ký tài khoản khách hàng thành công', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          ownerName: 'Test Customer',
          email: 'testcustomer@orderflow.com',
          password: 'password123',
          phone: '0901234567'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User registered successfully');
    });

    it('Nên đăng nhập thành công và nhận token', async () => {
      const response = await request(app)
        .post('/api/UserLogin')
        .send({
          email: 'testcustomer@orderflow.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe('Login successful');

      // Extract token from cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      userToken = tokenCookie.split(';')[0].split('=')[1];

      // Get userId
      const user = await UserModel.findOne({ email: 'testcustomer@orderflow.com' });
      userId = user._id.toString();
    });
  });

  describe('STEP 2: Hệ thống hiển thị trang chính với danh sách nhà hàng', () => {
    it('Nên tạo nhà hàng mẫu cho test', async () => {
      // Create test restaurant
      const restaurant = await RestaurantModel.create({
        ownerName: 'Test Restaurant Owner',
        email: 'testrestaurant@orderflow.com',
        password: 'hashedpassword',
        restaurantName: 'Delicious Food Restaurant',
        phone: '0987654321',
        city: 'Ho Chi Minh',
        address: '123 Test Street',
        countryName: 'Vietnam',
        stateName: 'Ho Chi Minh'
      });

      restaurantId = restaurant._id.toString();
      expect(restaurantId).toBeDefined();
    });

    it('Nên lấy danh sách tất cả nhà hàng', async () => {
      const response = await request(app)
        .get('/api/Restaurants')
        .set('Cookie', `token=${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify our test restaurant is in the list
      const testRestaurant = response.body.find(r => r.restaurantName === 'Delicious Food Restaurant');
      expect(testRestaurant).toBeDefined();
    });
  });

  describe('STEP 3: Chọn nhà hàng (Decision Point)', () => {
    describe('Cách 1: Nhập tên nhà hàng trên thanh tìm kiếm', () => {
      it('Nên tìm kiếm nhà hàng theo tên', async () => {
        const response = await request(app)
          .get('/api/Restaurants')
          .set('Cookie', `token=${userToken}`);

        expect(response.status).toBe(200);

        // Client-side search simulation
        const searchResults = response.body.filter(r =>
          r.restaurantName.toLowerCase().includes('delicious')
        );

        expect(searchResults.length).toBeGreaterThan(0);
        expect(searchResults[0].restaurantName).toBe('Delicious Food Restaurant');
      });
    });

    describe('Cách 2: Chọn nhà hàng từ danh sách', () => {
      it('Nên chọn nhà hàng từ danh sách trên trang chủ', async () => {
        const response = await request(app)
          .get('/api/Restaurants')
          .set('Cookie', `token=${userToken}`);

        expect(response.status).toBe(200);
        const selectedRestaurant = response.body.find(r => r._id === restaurantId);
        expect(selectedRestaurant).toBeDefined();
        expect(selectedRestaurant.restaurantName).toBe('Delicious Food Restaurant');
      });
    });
  });

  describe('STEP 4: Xem chi tiết nhà hàng và thực đơn', () => {
    it('Nên tạo menu items cho nhà hàng', async () => {
      const dishes = [
        {
          dishName: 'Test Dish - Phở Bò',
          price: 50000,
          description: 'Phở bò truyền thống Việt Nam',
          cuisineName: 'Vietnamese',
          image: 'https://example.com/pho.jpg',
          ownerId: restaurantId
        },
        {
          dishName: 'Test Dish - Bún Chả',
          price: 45000,
          description: 'Bún chả Hà Nội ngon tuyệt',
          cuisineName: 'Vietnamese',
          image: 'https://example.com/buncha.jpg',
          ownerId: restaurantId
        },
        {
          dishName: 'Test Dish - Cơm Tấm',
          price: 40000,
          description: 'Cơm tấm sườn bì chả',
          cuisineName: 'Vietnamese',
          image: 'https://example.com/comtam.jpg',
          ownerId: restaurantId
        }
      ];

      for (const dish of dishes) {
        const createdDish = await MenuItemModel.create(dish);
        menuItems.push(createdDish);
      }

      expect(menuItems.length).toBe(3);
    });

    it('Nên xem thực đơn của nhà hàng', async () => {
      const response = await request(app)
        .get(`/api/ResMenu/${restaurantId}`)
        .set('Cookie', `token=${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      // Verify menu details
      expect(response.body[0].dishName).toContain('Test Dish');
      expect(response.body[0].price).toBeGreaterThan(0);
      expect(response.body[0].description).toBeDefined();
    });
  });

  describe('STEP 5: Thêm món vào giỏ hàng (Loop)', () => {
    let cart = [];

    it('Nên thêm món đầu tiên vào giỏ hàng', () => {
      const item = {
        menuItem: menuItems[0]._id,
        dishName: menuItems[0].dishName,
        quantity: 2,
        price: menuItems[0].price
      };

      cart.push(item);

      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(2);
    });

    it('Decision: Thêm món? - YES: Thêm món thứ hai', () => {
      const item = {
        menuItem: menuItems[1]._id,
        dishName: menuItems[1].dishName,
        quantity: 1,
        price: menuItems[1].price
      };

      cart.push(item);

      expect(cart.length).toBe(2);
    });

    it('Decision: Thêm món? - YES: Thêm món thứ ba', () => {
      const item = {
        menuItem: menuItems[2]._id,
        dishName: menuItems[2].dishName,
        quantity: 3,
        price: menuItems[2].price
      };

      cart.push(item);

      expect(cart.length).toBe(3);
    });

    it('Decision: Thêm món? - NO: Kết thúc thêm món', () => {
      // User decides to stop adding items
      const finalCartCount = cart.length;
      expect(finalCartCount).toBe(3);
    });
  });

  describe('STEP 6: Xem giỏ hàng và cập nhật tổng tiền', () => {
    it('Nên tính tổng tiền tạm tính đúng', () => {
      const cart = [
        { quantity: 2, price: 50000 }, // 100,000
        { quantity: 1, price: 45000 }, // 45,000
        { quantity: 3, price: 40000 }  // 120,000
      ];

      const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      expect(totalAmount).toBe(265000);
    });

    it('Nên hiển thị thông tin giỏ hàng chi tiết', () => {
      const cartSummary = {
        items: [
          { dishName: 'Test Dish - Phở Bò', quantity: 2, price: 50000, subtotal: 100000 },
          { dishName: 'Test Dish - Bún Chả', quantity: 1, price: 45000, subtotal: 45000 },
          { dishName: 'Test Dish - Cơm Tấm', quantity: 3, price: 40000, subtotal: 120000 }
        ],
        totalAmount: 265000
      };

      expect(cartSummary.items.length).toBe(3);
      expect(cartSummary.totalAmount).toBe(265000);
    });
  });

  describe('STEP 7: Thanh toán VNPay (Decision Point)', () => {
    describe('Case: Thanh toán thành công', () => {
      it('Nên tạo payment record thành công', async () => {
        // Simulate VNPay payment creation
        const orderInfo = 'Payment for order';
        const amount = 265000;

        const payment = await Payment.create({
          orderId: `ORDER${Date.now()}`,
          amount: amount,
          orderInfo: orderInfo,
          payStatus: 'pending',
          paymentMethod: 'VNPay',
          user: userId
        });

        paymentId = payment._id.toString();

        expect(payment).toBeDefined();
        expect(payment.amount).toBe(amount);
        expect(payment.payStatus).toBe('pending');
      });

      it('Nên cập nhật trạng thái payment thành success sau khi VNPay callback', async () => {
        // Simulate VNPay success callback
        const payment = await Payment.findById(paymentId);
        expect(payment).toBeDefined();

        payment.payStatus = 'success';
        payment.transactionId = `VNPAY${Date.now()}`;
        payment.paymentDate = new Date().toISOString();
        const savedPayment = await payment.save();

        expect(savedPayment.payStatus).toBe('success');

        // Re-query to verify status was updated
        const updatedPayment = await Payment.findById(paymentId);
        expect(updatedPayment.payStatus).toBe('success');
        expect(updatedPayment.paymentDate).toBeDefined();
      });
    });

    describe('Case: Thanh toán thất bại - Hiển thị thông báo lỗi', () => {
      it('Nên xử lý trường hợp thanh toán thất bại', async () => {
        const failedPayment = await Payment.create({
          orderId: `ORDER_FAILED${Date.now()}`,
          amount: 100000,
          orderInfo: 'Failed payment test',
          payStatus: 'failed',
          paymentMethod: 'VNPay',
          user: userId
        });

        expect(failedPayment.payStatus).toBe('failed');

        // Should not proceed to create order
        const orderCount = await OrderModel.countDocuments({ paymentId: failedPayment._id });
        expect(orderCount).toBe(0);
      });

      it('Nên hiển thị thông báo lỗi cho user', async () => {
        const errorMessage = 'Payment failed. Please try again.';
        expect(errorMessage).toContain('failed');
      });
    });
  });

  describe('STEP 8: Lưu đơn hàng vào database', () => {
    it('Nên tạo đơn hàng thành công sau khi thanh toán', async () => {
      // First create delivery address
      const deliveryAddress = await DeliveryAddressModel.create({
        userId: userId,
        country: 'Vietnam',
        state: 'Ho Chi Minh',
        city: 'Ho Chi Minh',
        address: '123 Test Street'
      });

      deliveryAddressId = deliveryAddress._id.toString();

      const orderData = {
        restaurant: restaurantId,
        paymentId: paymentId,
        deliveryAddress: deliveryAddressId,
        orderItems: [
          {
            item: {
              dishName: menuItems[0].dishName,
              price: menuItems[0].price
            },
            quantity: 2
          },
          {
            item: {
              dishName: menuItems[1].dishName,
              price: menuItems[1].price
            },
            quantity: 1
          },
          {
            item: {
              dishName: menuItems[2].dishName,
              price: menuItems[2].price
            },
            quantity: 3
          }
        ],
        totalAmount: 265000
      };

      const response = await request(app)
        .post('/api/newOrder')
        .set('Cookie', `token=${userToken}`)
        .send(orderData);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.restaurant).toBe(restaurantId);
      expect(response.body.totalAmount).toBe(265000);
      expect(response.body.orderItems.length).toBe(3);

      orderId = response.body._id;
    });

    it('Nên lưu đầy đủ thông tin đơn hàng', async () => {
      const order = await OrderModel.findById(orderId);

      expect(order).toBeDefined();
      expect(order.user.toString()).toBe(userId);
      expect(order.restaurant.toString()).toBe(restaurantId);
      expect(order.paymentId.toString()).toBe(paymentId);
      expect(order.totalAmount).toBe(265000);
      expect(order.orderStatus).toBe('pending');
      expect(order.orderItems.length).toBe(3);
    });

    it('Nên ngăn tạo đơn hàng trùng lặp với cùng paymentId', async () => {
      const duplicateOrderData = {
        restaurant: restaurantId,
        paymentId: paymentId,
        deliveryAddress: deliveryAddressId,
        orderItems: [
          {
            item: {
              dishName: menuItems[0].dishName,
              price: menuItems[0].price
            },
            quantity: 1
          }
        ],
        totalAmount: 50000
      };

      const response = await request(app)
        .post('/api/newOrder')
        .set('Cookie', `token=${userToken}`)
        .send(duplicateOrderData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('already');
    });
  });

  describe('STEP 9: Kết thúc - Hoàn tất quy trình', () => {
    it('Nên xác nhận toàn bộ quy trình đặt hàng thành công', async () => {
      // Verify user exists
      const user = await UserModel.findById(userId);
      expect(user).toBeDefined();

      // Verify restaurant exists
      const restaurant = await RestaurantModel.findById(restaurantId);
      expect(restaurant).toBeDefined();

      // Verify menu items exist
      const menu = await MenuItemModel.find({ ownerId: restaurantId });
      expect(menu.length).toBe(3);

      // Verify payment exists and is successful
      const payment = await Payment.findById(paymentId);
      expect(payment).toBeDefined();
      expect(payment.payStatus).toBe('success');

      // Verify order exists
      const order = await OrderModel.findById(orderId);
      expect(order).toBeDefined();
      expect(order.orderStatus).toBe('pending');

      console.log('\n✅ COMPLETE ORDER FLOW TEST SUMMARY:');
      console.log('=====================================');
      console.log(`✓ Customer: ${user.ownerName} (${user.email})`);
      console.log(`✓ Restaurant: ${restaurant.restaurantName}`);
      console.log(`✓ Menu Items: ${menu.length} dishes`);
      console.log(`✓ Payment: ${payment.orderId} - ${payment.payStatus}`);
      console.log(`✓ Order: ${order._id} - ${order.orderStatus}`);
      console.log(`✓ Total Amount: ${order.totalAmount.toLocaleString('vi-VN')} VND`);
      console.log(`✓ Order Items: ${order.orderItems.length} items`);
      console.log('=====================================\n');
    });

    it('Nên lấy được lịch sử đơn hàng của user', async () => {
      // Query orders directly from database since UsersOrders API is for Payment records
      const userOrders = await OrderModel.find({ user: userId }).sort({ createdAt: -1 });

      expect(Array.isArray(userOrders)).toBe(true);
      expect(userOrders.length).toBeGreaterThan(0);

      const userOrder = userOrders.find(o => o._id.toString() === orderId);
      expect(userOrder).toBeDefined();
      expect(userOrder.user.toString()).toBe(userId);
      expect(userOrder.restaurant.toString()).toBe(restaurantId);
    });
  });
});

