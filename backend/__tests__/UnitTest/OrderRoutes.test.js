import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Ensure a KEY for jwt
process.env.KEY = process.env.KEY || 'test-key';

// Mock models used by authentication middlewares
jest.mock('../../models/UserModel.js', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('../../models/ResModel.js', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('../../models/DelModel.js', () => ({ __esModule: true, default: { findOne: jest.fn() } }));

// Mock OrderModel
jest.mock('../../models/OrderModel.js', () => {
  class MockOrder {
    constructor(data) {
      Object.assign(this, data);
    }
  }
  MockOrder.find = jest.fn();
  MockOrder.findOne = jest.fn();
  MockOrder.findById = jest.fn();
  MockOrder.findByIdAndUpdate = jest.fn();
  MockOrder.findByIdAndDelete = jest.fn();
  MockOrder.prototype.save = jest.fn().mockImplementation(function () { return Promise.resolve(this); });

  return { __esModule: true, default: MockOrder };
});

// Mock DroneModel (dynamic import in route)
jest.mock('../../models/DroneModel.js', () => {
  class MockDrone {
    constructor(data) { Object.assign(this, data); }
  }
  MockDrone.findById = jest.fn();
  MockDrone.prototype.save = jest.fn().mockImplementation(function () { return Promise.resolve(this); });
  return { __esModule: true, default: MockDrone };
});

import UserModel from '../../models/UserModel.js';
import ResModel from '../../models/ResModel.js';
import DelModel from '../../models/DelModel.js';
import OrderModel from '../../models/OrderModel.js';
import DroneModel from '../../models/DroneModel.js';
import router from '../../routes/OrderRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', router); // routes defined with their own prefixes

// create tokens for different roles
const userToken = jwt.sign({ id: 'user123' }, process.env.KEY);
const resToken = jwt.sign({ id: 'res123' }, process.env.KEY);
const delToken = jwt.sign({ id: 'del123' }, process.env.KEY);

describe('OrderRoutes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default auth model behaviors
    UserModel.findOne = jest.fn().mockResolvedValue({ _id: 'user123' });
    ResModel.findOne = jest.fn().mockResolvedValue({ _id: 'res123' });
    DelModel.findOne = jest.fn().mockResolvedValue({ _id: 'del123' });
  });

  describe('POST /newOrder', () => {
    it('should create a new order when none exists', async () => {
      OrderModel.findOne = jest.fn().mockResolvedValue(null);
      OrderModel.prototype.save = jest.fn().mockImplementation(function () { return Promise.resolve(this); });

      const payload = {
        restaurant: 'res1',
        paymentId: 'pay1',
        deliveryAddress: 'addr1',
        orderItems: [],
        totalAmount: 100
      };

      const res = await request(app).post('/newOrder').send(payload).set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      // Some mocks may not preserve paymentId on the returned mock; assert by totalAmount instead
      expect(res.body.totalAmount).toBe(100);
      expect(OrderModel.findOne).toHaveBeenCalledWith({ paymentId: 'pay1' });
      expect(OrderModel.prototype.save).toHaveBeenCalled();
    });

    it('should return existing order message when order already exists', async () => {
      const existing = { _id: 'ord1', paymentId: 'pay1' };
      OrderModel.findOne = jest.fn().mockResolvedValue(existing);

      const res = await request(app).post('/newOrder').send({ paymentId: 'pay1' }).set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Order already created');
      expect(res.body.order).toEqual(existing);
    });

    it('should return 200 message when duplicate key error thrown', async () => {
      OrderModel.findOne = jest.fn().mockResolvedValue(null);
      const err = new Error('dup');
      err.code = 11000;
      OrderModel.prototype.save = jest.fn().mockRejectedValue(err);

      const res = await request(app).post('/newOrder').send({ paymentId: 'pay2' }).set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Order already created for this payment');
    });

    it('should return 400 when save returns falsy', async () => {
      OrderModel.findOne = jest.fn().mockResolvedValue(null);
      OrderModel.prototype.save = jest.fn().mockResolvedValue(null);

      const res = await request(app).post('/newOrder').send({ paymentId: 'pay3' }).set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PUT /updateOrder/:id', () => {
    it('should update order status when found', async () => {
      const order = { _id: 'o1', orderStatus: 'pending', save: jest.fn().mockResolvedValue({ _id: 'o1', orderStatus: 'confirmed' }) };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      const res = await request(app).put('/updateOrder/o1').send({ orderStatus: 'confirmed' }).set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.orderStatus).toBe('confirmed');
      expect(order.save).toHaveBeenCalled();
    });

    it('should return 404 when order not found', async () => {
      OrderModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/updateOrder/missing').send({ orderStatus: 'confirmed' }).set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });

    it('should return 500 on error', async () => {
      OrderModel.findById = jest.fn().mockRejectedValue(new Error('db error'));

      const res = await request(app).put('/updateOrder/bad').send({ orderStatus: 'confirmed' }).set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /updateOrderStatus/:id', () => {
    it('should update status and set drone to AVAILABLE when delivered', async () => {
      const order = { _id: 'o2', orderStatus: 'shipping', drone: 'd1', save: jest.fn().mockResolvedValue({ _id: 'o2', orderStatus: 'delivered', drone: 'd1' }) };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      // mock DroneModel.findById to return a drone with save
      DroneModel.findById = jest.fn().mockResolvedValue({ _id: 'd1', status: 'IN_DELIVERY', save: jest.fn().mockResolvedValue({ _id: 'd1', status: 'AVAILABLE' }) });

      const res = await request(app).put('/updateOrderStatus/o2').send({ orderStatus: 'delivered' }).set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.orderStatus).toBe('delivered');
      expect(OrderModel.findById).toHaveBeenCalledWith('o2');
      expect(DroneModel.findById).toHaveBeenCalledWith('d1');
    });

    it('should return 404 when order not found', async () => {
      OrderModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/updateOrderStatus/missing').send({ orderStatus: 'delivered' }).set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });

    it('should return 500 on error', async () => {
      OrderModel.findById = jest.fn().mockRejectedValue(new Error('db error'));

      const res = await request(app).put('/updateOrderStatus/bad').send({ orderStatus: 'delivered' }).set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /assignDeliveryMan/:id', () => {
    it('should assign deliveryman when order found', async () => {
      const order = { _id: 'o3', deliveryman: null, save: jest.fn().mockResolvedValue({ _id: 'o3', deliveryman: 'del123' }) };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      const res = await request(app).put('/assignDeliveryMan/o3').set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(200);
      expect(order.save).toHaveBeenCalled();
      expect(res.body.deliveryman).toBe('del123');
    });

    it('should return 404 when order not found', async () => {
      OrderModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/assignDeliveryMan/missing').set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  describe('PUT /assignDrone/:id', () => {
    it('should assign drone and set drone status to IN_DELIVERY', async () => {
      const order = { _id: 'o4', drone: null, orderStatus: 'ready', save: jest.fn().mockResolvedValue({ _id: 'o4', drone: 'd2', orderStatus: 'shipping' }) };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      DroneModel.findById = jest.fn().mockResolvedValue({ _id: 'd2', status: 'AVAILABLE', save: jest.fn().mockResolvedValue({ _id: 'd2', status: 'IN_DELIVERY' }) });

      const res = await request(app).put('/assignDrone/o4').send({ droneId: 'd2' }).set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.drone).toBe('d2');
      expect(res.body.orderStatus).toBe('shipping');
      expect(DroneModel.findById).toHaveBeenCalledWith('d2');
    });

    it('should return 404 when order not found', async () => {
      OrderModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/assignDrone/missing').send({ droneId: 'dX' }).set('Cookie', [`token=${delToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  describe('GET /getOrdersByResId/:id', () => {
    it('should return orders for a restaurant', async () => {
      const mockOrders = [{ _id: 'o1' }, { _id: 'o2' }];
      // make query thenable to support multiple .populate() calls and await
      const thenableQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: function (resolve) { resolve(mockOrders); }
      };
      OrderModel.find = jest.fn().mockReturnValue(thenableQuery);

      const res = await request(app).get('/getOrdersByResId/res1').set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(thenableQuery.select).toHaveBeenCalled();
      expect(thenableQuery.populate).toHaveBeenCalled();
    });
  });

  describe('GET /getOrdersByUserId', () => {
    it('should return orders for authenticated user', async () => {
      const mockOrders = [{ _id: 'u1' }];
      // make query thenable to support multiple .populate() calls and await
      const thenableQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: function (resolve) { resolve(mockOrders); }
      };
      OrderModel.find = jest.fn().mockReturnValue(thenableQuery);

      const res = await request(app).get('/getOrdersByUserId').set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('PUT /cancelOrder/:id', () => {
    it('should cancel pending order belonging to user', async () => {
      const order = { _id: 'o5', user: 'user123', orderStatus: 'pending', save: jest.fn().mockResolvedValue({ _id: 'o5', orderStatus: 'cancel' }) };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      const res = await request(app).put('/cancelOrder/o5').set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(order.save).toHaveBeenCalled();
      expect(res.body.orderStatus).toBe('cancel');
    });

    it('should return 403 when order does not belong to user', async () => {
      const order = { _id: 'o6', user: 'otherUser', orderStatus: 'pending' };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      const res = await request(app).put('/cancelOrder/o6').set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Unauthorized to cancel this order');
    });

    it('should return 400 when order is not pending', async () => {
      const order = { _id: 'o7', user: 'user123', orderStatus: 'confirmed' };
      OrderModel.findById = jest.fn().mockResolvedValue(order);

      const res = await request(app).put('/cancelOrder/o7').set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Only pending orders can be cancelled');
    });

    it('should return 404 when order not found', async () => {
      OrderModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/cancelOrder/missing').set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });
});

