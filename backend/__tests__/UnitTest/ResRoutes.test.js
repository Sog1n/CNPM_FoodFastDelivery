import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock nodemailer BEFORE importing the routes that use it
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: (mailOptions, cb) => cb(null, { response: '250 OK' })
  }))
}));

// Mock UserModel used by AuthenticateUser middleware (from UserRoutes)
jest.mock('../../models/UserModel.js');
import UserModel from '../../models/UserModel.js';

// Mock RestaurantModel
jest.mock('../../models/ResModel.js');
import RestaurantModel from '../../models/ResModel.js';

// Import router after mocks
import router from '../../routes/ResRoutes.js';

// Ensure env key
process.env.KEY = process.env.KEY || 'test-key';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.RAILWAY_ENVIRONMENT_NAME = process.env.RAILWAY_ENVIRONMENT_NAME || 'development';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', router);

describe('ResRoutes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /res/register', () => {
    it('should register a new restaurant successfully', async () => {
      RestaurantModel.findOne = jest.fn().mockResolvedValue(null);
      RestaurantModel.prototype.save = jest.fn().mockResolvedValue({ _id: 'res123', restaurantName: 'R1' });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-pass');

      const res = await request(app)
        .post('/res/register')
        .send({ ownerName: 'Owner', password: 'secret', restaurantName: 'R1', email: 'r1@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(RestaurantModel.findOne).toHaveBeenCalledWith({ email: 'r1@example.com' });
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should return 400 when restaurant already exists', async () => {
      RestaurantModel.findOne = jest.fn().mockResolvedValue({ _id: 'exists' });

      const res = await request(app)
        .post('/res/register')
        .send({ ownerName: 'Owner', password: 'secret', restaurantName: 'R1', email: 'r1@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /ResLogin', () => {
    it('should login successfully and set cookie', async () => {
      const user = { _id: 'res123', password: 'hashed-pass' };
      RestaurantModel.findOne = jest.fn().mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await request(app)
        .post('/ResLogin')
        .send({ email: 'r1@example.com', password: 'secret' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(RestaurantModel.findOne).toHaveBeenCalledWith({ email: 'r1@example.com' });
    });

    it('should return 400 if restaurant not registered', async () => {
      RestaurantModel.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/ResLogin')
        .send({ email: 'no@example.com', password: 'secret' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User is not registered');
    });

    it('should return 400 if password incorrect', async () => {
      const user = { _id: 'res123', password: 'hashed-pass' };
      RestaurantModel.findOne = jest.fn().mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await request(app)
        .post('/ResLogin')
        .send({ email: 'r1@example.com', password: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is incorrect');
    });
  });

  describe('POST /ResForgotPasswordDialog', () => {
    it('should return message when restaurant not registered', async () => {
      RestaurantModel.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/ResForgotPasswordDialog')
        .send({ email: 'no@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User not registered');
    });
  });

  describe('POST /ResResetPassword/:token', () => {
    it('should reset password when token valid', async () => {
      const resId = 'res123';
      const token = jwt.sign({ id: resId }, process.env.KEY, { expiresIn: '1h' });
      RestaurantModel.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: resId });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newhashed');

      const res = await request(app)
        .post(`/ResResetPassword/${token}`)
        .send({ password: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(RestaurantModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should return Invalid Token for malformed token', async () => {
      const res = await request(app)
        .post('/ResResetPassword/invalidtoken')
        .send({ password: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Invalid Token');
    });
  });

  describe('GET /logout', () => {
    it('should clear cookie and return status true', async () => {
      const res = await request(app).get('/logout');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
    });
  });

  describe('Authenticate middleware and dashboard', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/RestaurantLayout/ResDashBoard');
      expect(res.status).toBe(401);
    });

    it('should return restaurant data when token valid', async () => {
      const restaurant = { _id: 'res123', restaurantName: 'R1' };
      RestaurantModel.findOne = jest.fn().mockResolvedValue(restaurant);
      const token = jwt.sign({ id: 'res123' }, process.env.KEY, { expiresIn: '1h' });

      const res = await request(app)
        .get('/RestaurantLayout/ResDashBoard')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe('res123');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/RestaurantLayout/ResDashBoard')
        .set('Cookie', ['token=bad.token.value']);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /Restaurants (with AuthenticateUser middleware)', () => {
    it('should return restaurants list when user authenticated', async () => {
      // Mock user auth middleware by mocking UserModel.findOne used inside AuthenticateUser
      UserModel.findOne = jest.fn().mockResolvedValue({ _id: 'user123' });

      const mockRestaurants = [
        { _id: 'r1', restaurantName: 'R1' },
        { _id: 'r2', restaurantName: 'R2' }
      ];

      // Create a query-like mock that supports chaining .select().populate()
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockRestaurants)
      };
      RestaurantModel.find = jest.fn().mockReturnValue(mockQuery);

      const userToken = jwt.sign({ id: 'user123' }, process.env.KEY, { expiresIn: '1h' });
      const res = await request(app)
        .get('/Restaurants')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(RestaurantModel.find).toHaveBeenCalled();
      expect(mockQuery.select).toHaveBeenCalledWith("-password -ownerName");
      expect(mockQuery.populate).toHaveBeenCalledWith("menu");
    });
  });

  describe('PATCH /updateStatus/:restaurantId', () => {
    it('should update status successfully', async () => {
      const restaurant = { _id: 'res123', isOpen: false, save: jest.fn().mockResolvedValue(true) };
      // middleware Authenticate uses findOne to locate rootResUser
      RestaurantModel.findOne = jest.fn().mockResolvedValue(restaurant);
      // route uses findById to get the restaurant to update
      RestaurantModel.findById = jest.fn().mockResolvedValue(restaurant);

      const token = jwt.sign({ id: 'res123' }, process.env.KEY, { expiresIn: '1h' });
      const res = await request(app)
        .patch('/updateStatus/res123')
        .set('Cookie', [`token=${token}`])
        .send({ status: 'Open' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Status updated successfully');
      expect(restaurant.save).toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      // middleware should find the requesting restaurant/user
      RestaurantModel.findOne = jest.fn().mockResolvedValue({ _id: 'res123' });
      // but the actual restaurant record to update is not found
      RestaurantModel.findById = jest.fn().mockResolvedValue(null);
      const token = jwt.sign({ id: 'res123' }, process.env.KEY, { expiresIn: '1h' });

      const res = await request(app)
        .patch('/updateStatus/res123')
        .set('Cookie', [`token=${token}`])
        .send({ status: 'Open' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Restaurant not found');
    });
  });
});
