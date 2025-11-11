import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, clearDatabase, getApp } from './testSetup.js';
import { createTestUser, createTestRestaurant, createTestDelivery } from './testHelpers.js';
import UserModel from '../../models/UserModel.js';
import ResModel from '../../models/ResModel.js';
import DelModel from '../../models/DelModel.js';

describe('Authentication Flow Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = await setupTestEnvironment();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('User Authentication Flow', () => {
    it('should complete user registration and login flow', async () => {
      // Step 1: Register new user
      const userData = {
        ownerName: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
        phone: '0123456789'
      };

      const registerRes = await request(app)
        .post('/auth/user/register')
        .send(userData);

      expect(registerRes.status).toBe(200);
      expect(registerRes.body).toHaveProperty('message');

      // Verify user created in database
      const userInDb = await UserModel.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.ownerName).toBe(userData.ownerName);

      // Step 2: Login with created user
      const loginRes = await request(app)
        .post('/auth/UserLogin')
        .send({
          email: userData.email,
          password: 'password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('status', true);

      // Check token in cookies
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      expect(tokenCookie).toBeDefined();

      // Step 3: Access protected route with token
      const token = tokenCookie.split(';')[0].split('=')[1];

      const protectedRes = await request(app)
        .get('/auth/UsersRestaurant')
        .set('Cookie', [`token=${token}`]);

      expect(protectedRes.status).toBe(200);
      expect(protectedRes.body).toHaveProperty('_id');
    });

    it('should reject login with invalid credentials', async () => {
      const loginRes = await request(app)
        .post('/auth/UserLogin')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });

      expect(loginRes.status).toBe(400);
    });

    it('should reject duplicate user registration', async () => {
      const userData = await createTestUser();

      // Create first user
      await UserModel.create(userData);

      // Try to register with same email
      const registerRes = await request(app)
        .post('/auth/user/register')
        .send({
          ownerName: 'Another User',
          email: userData.email,
          password: 'password123',
          phone: '0987654321'
        });

      expect(registerRes.status).toBe(400);
      expect(registerRes.body).toHaveProperty('message');
    });
  });

  describe('Restaurant Authentication Flow', () => {
    it('should complete restaurant registration and login flow', async () => {
      // Step 1: Register new restaurant
      const resData = {
        restaurantName: 'Test Restaurant',
        ownerName: 'Restaurant Owner',
        email: 'restaurant@test.com',
        password: 'password123',
        address: '123 Food Street',
        phone: '0123456789',
        city: 'Ho Chi Minh',
        countryName: 'Vietnam',
        stateName: 'HCM'
      };

      const registerRes = await request(app)
        .post('/auth/res/register')
        .send(resData);

      expect(registerRes.status).toBe(200);

      // Verify restaurant created
      const resInDb = await ResModel.findOne({ email: resData.email });
      expect(resInDb).toBeTruthy();
      expect(resInDb.restaurantName).toBe(resData.restaurantName);

      // Step 2: Login
      const loginRes = await request(app)
        .post('/auth/ResLogin')
        .send({
          email: resData.email,
          password: 'password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('status', true);

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('should allow restaurant to access orders after login', async () => {
      // Create and login restaurant
      const resData = await createTestRestaurant();
      const restaurant = await ResModel.create(resData);

      const loginRes = await request(app)
        .post('/auth/ResLogin')
        .send({
          email: resData.email,
          password: 'password123'
        });

      const cookies = loginRes.headers['set-cookie'];
      const token = cookies.find(c => c.startsWith('token=')).split(';')[0].split('=')[1];

      // Access orders endpoint
      const ordersRes = await request(app)
        .get(`/api/order/getOrdersByResId/${restaurant._id}`)
        .set('Cookie', [`token=${token}`]);

      expect(ordersRes.status).toBe(200);
    });
  });

  describe('Delivery Partner Authentication Flow', () => {
    it('should complete delivery partner registration and login flow', async () => {
      // Step 1: Register new delivery partner
      const delData = {
        ownerName: 'Delivery Partner',
        email: 'delivery@test.com',
        password: 'password123',
        phone: '0123456789',
        drivingLicenceNo: 'DL123456',
        address: '456 Delivery Street',
        city: 'Ho Chi Minh',
        countryName: 'Vietnam',
        stateName: 'HCM'
      };

      const registerRes = await request(app)
        .post('/auth/delivery/register')
        .send(delData);

      expect(registerRes.status).toBe(200);

      // Verify created
      const delInDb = await DelModel.findOne({ email: delData.email });
      expect(delInDb).toBeTruthy();

      // Step 2: Login
      const loginRes = await request(app)
        .post('/auth/DelLogin')
        .send({
          email: delData.email,
          password: 'password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('status', true);
    });
  });

  describe('Cross-Role Authentication', () => {
    it('should not allow user token to access restaurant routes', async () => {
      // Create user
      const userData = await createTestUser();
      const user = await UserModel.create(userData);

      // Login as user
      const loginRes = await request(app)
        .post('/auth/UserLogin')
        .send({
          email: userData.email,
          password: 'password123'
        });

      const cookies = loginRes.headers['set-cookie'];
      const token = cookies.find(c => c.startsWith('token=')).split(';')[0].split('=')[1];

      // Try to access restaurant-only route
      const resOrdersRes = await request(app)
        .get('/api/order/getOrdersByResId/507f1f77bcf86cd799439011')
        .set('Cookie', [`token=${token}`]);

      // Should fail authentication or return empty/unauthorized
      expect([401, 403, 404]).toContain(resOrdersRes.status);
    });


  });
});

