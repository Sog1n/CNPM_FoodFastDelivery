import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../../models/UserModel.js';

// Mock nodemailer BEFORE importing the routes that use it
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: (mailOptions, cb) => cb(null, { response: '250 OK' })
  }))
}));

import router, { AuthenticateUser } from '../../routes/UserRoutes.js';

// Ensure env key for signing/verifying tokens during tests
process.env.KEY = process.env.KEY || 'test-key';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', router);

describe('UserRoutes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // restore real implementations if spied
    if (bcrypt.hash.mockRestore) try { bcrypt.hash.mockRestore(); } catch (e) {}
    if (bcrypt.compare.mockRestore) try { bcrypt.compare.mockRestore(); } catch (e) {}
  });

  describe('POST /user/register', () => {
    it('should register a new user successfully', async () => {
      // setup
      UserModel.findOne = jest.fn().mockResolvedValue(null);
      const fakeSave = jest.fn().mockResolvedValue({ _id: 'user123', ownerName: 'John' });
      // mock constructor save
      UserModel.prototype.save = fakeSave;
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-pass');

      const res = await request(app)
        .post('/user/register')
        .send({ ownerName: 'John', password: 'secret', email: 'john@example.com', phone: '0123' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should return 400 when user already exists', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue({ _id: 'exists' });

      const res = await request(app)
        .post('/user/register')
        .send({ ownerName: 'John', password: 'secret', email: 'john@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /UserLogin', () => {
    it('should login successfully and set cookie', async () => {
      const user = { _id: 'user123', password: 'hashed-pass' };
      UserModel.findOne = jest.fn().mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await request(app)
        .post('/UserLogin')
        .send({ email: 'john@example.com', password: 'secret' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      // Set-Cookie header should be present
      expect(res.headers['set-cookie']).toBeDefined();
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should return 400 if user not registered', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/UserLogin')
        .send({ email: 'noone@example.com', password: 'secret' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User is not registered');
    });

    it('should return 400 if password incorrect', async () => {
      const user = { _id: 'user123', password: 'hashed-pass' };
      UserModel.findOne = jest.fn().mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await request(app)
        .post('/UserLogin')
        .send({ email: 'john@example.com', password: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is incorrect');
    });
  });

  describe('POST /UserForgotPasswordDialog', () => {


    it('should return message when user not registered', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/UserForgotPasswordDialog')
        .send({ email: 'noone@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User not registered');
    });
  });

  describe('POST /UserResetPassword/:token', () => {
    it('should reset password when token valid', async () => {
      const userId = 'user123';
      const token = jwt.sign({ id: userId }, process.env.KEY, { expiresIn: '1h' });

      UserModel.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: userId });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newhashed');

      const res = await request(app)
        .post(`/UserResetPassword/${token}`)
        .send({ password: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should return Invalid Token for malformed token', async () => {
      const res = await request(app)
        .post('/UserResetPassword/invalidtoken')
        .send({ password: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Invalid Token');
    });
  });

  describe('GET /UserLogout', () => {
    it('should clear cookie and return status true', async () => {
      const res = await request(app).get('/UserLogout');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
    });
  });

  describe('AuthenticateUser middleware and /UsersRestaurant', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/UsersRestaurant');
      expect(res.status).toBe(401);
    });

    it('should return user data when token valid', async () => {
      const user = { _id: 'user123', ownerName: 'John' };
      UserModel.findOne = jest.fn().mockResolvedValue(user);
      const token = jwt.sign({ id: 'user123' }, process.env.KEY, { expiresIn: '1h' });

      const res = await request(app)
        .get('/UsersRestaurant')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe('user123');
    });

    it('should return 401 for invalid token', async () => {
      // set a malformed token
      const res = await request(app)
        .get('/UsersRestaurant')
        .set('Cookie', ['token=bad.token.value']);

      expect(res.status).toBe(401);
    });
  });
});
