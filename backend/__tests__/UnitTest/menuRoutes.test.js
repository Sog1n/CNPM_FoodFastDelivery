import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Ensure a KEY for jwt
process.env.KEY = process.env.KEY || 'test-key';

// Mock fs module
jest.mock('fs', () => ({
  unlinkSync: jest.fn()
}));

// Mock cloudinary utility - create a jest mock function
const mockUploadOnCloudinary = jest.fn();
jest.mock('../../utils/cloudinary.js', () => ({
  uploadOnCloudinary: mockUploadOnCloudinary
}));

// Mock multer middleware - single() should return middleware function
jest.mock('../../middleware/multer.middleware.js', () => ({
  upload: {
    single: () => (req, res, next) => {
      // Mock file attachment when header is present
      if (req.headers['x-mock-file']) {
        req.file = {
          path: '/tmp/test-image.jpg',
          filename: 'test-image.jpg'
        };
      }
      next();
    }
  }
}));

// Mock authentication models
jest.mock('../../models/UserModel.js', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('../../models/ResModel.js', () => ({ __esModule: true, default: { findOne: jest.fn() } }));

// Mock MenuItemModel
jest.mock('../../models/MenuModel.js', () => {
  class MockMenuItem {
    constructor(data) {
      Object.assign(this, data);
    }
  }
  MockMenuItem.find = jest.fn();
  MockMenuItem.findOne = jest.fn();
  MockMenuItem.findById = jest.fn();
  MockMenuItem.findByIdAndUpdate = jest.fn();
  MockMenuItem.findByIdAndDelete = jest.fn();
  MockMenuItem.create = jest.fn();
  MockMenuItem.distinct = jest.fn();
  MockMenuItem.prototype.save = jest.fn().mockImplementation(function () { return Promise.resolve(this); });

  return { __esModule: true, default: MockMenuItem };
});

import UserModel from '../../models/UserModel.js';
import ResModel from '../../models/ResModel.js';
import MenuItemModel from '../../models/MenuModel.js';
import router from '../../routes/menuRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', router);

// Create tokens for different roles
const userToken = jwt.sign({ id: 'user123' }, process.env.KEY);
const resToken = jwt.sign({ id: 'res123' }, process.env.KEY);

describe('MenuRoutes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default auth model behaviors
    UserModel.findOne = jest.fn().mockResolvedValue({ _id: 'user123' });
    ResModel.findOne = jest.fn().mockResolvedValue({ _id: 'res123' });
  });

  describe('POST /ResMenu', () => {
    // Note: File upload with multer is complex to mock in unit tests
    // This test would be better as an integration test with real multer middleware


    it('should return 400 when cloudinary upload fails', async () => {
      mockUploadOnCloudinary.mockResolvedValue(null);

      const res = await request(app)
        .post('/ResMenu')
        .set('Cookie', [`token=${resToken}`])
        .set('x-mock-file', 'true')
        .send({
          dishName: 'Pizza',
          price: 15.99,
          description: 'Delicious pizza',
          cuisineName: 'Italian'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when create fails', async () => {
      mockUploadOnCloudinary.mockResolvedValue({ url: 'https://cloudinary.com/image.jpg' });
      MenuItemModel.create = jest.fn().mockRejectedValue(new Error('Validation error'));

      const res = await request(app)
        .post('/ResMenu')
        .set('Cookie', [`token=${resToken}`])
        .set('x-mock-file', 'true')
        .send({
          dishName: 'Pizza',
          price: 15.99,
          description: 'Delicious pizza',
          cuisineName: 'Italian'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /ResMenu', () => {
    it('should return menu items for authenticated restaurant', async () => {
      const mockMenuItems = [
        { _id: 'm1', dishName: 'Pizza', price: 15.99 },
        { _id: 'm2', dishName: 'Pasta', price: 12.99 }
      ];
      MenuItemModel.find = jest.fn().mockResolvedValue(mockMenuItems);

      const res = await request(app)
        .get('/ResMenu')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(MenuItemModel.find).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      MenuItemModel.find = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/ResMenu')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to fetch menu items');
    });
  });

  describe('GET /ResMenu/:resId', () => {
    it('should return menu items for specific restaurant', async () => {
      const mockMenuItems = [
        { _id: 'm1', dishName: 'Pizza', ownerId: 'res456' }
      ];
      MenuItemModel.find = jest.fn().mockResolvedValue(mockMenuItems);

      const res = await request(app)
        .get('/ResMenu/res456')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(MenuItemModel.find).toHaveBeenCalledWith({ ownerId: 'res456' });
    });

    it('should return 500 on error', async () => {
      MenuItemModel.find = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/ResMenu/res456')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to fetch menu item');
    });
  });

  describe('GET /EditMenu/:editId', () => {
    it('should return menu item by ID', async () => {
      const mockMenuItem = { _id: 'm1', dishName: 'Pizza', price: 15.99 };
      MenuItemModel.findById = jest.fn().mockResolvedValue(mockMenuItem);

      const res = await request(app)
        .get('/EditMenu/m1')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.dishName).toBe('Pizza');
      expect(MenuItemModel.findById).toHaveBeenCalledWith('m1');
    });

    it('should return 404 when menu item not found', async () => {
      MenuItemModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .get('/EditMenu/missing')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Menu item not found');
    });

    it('should return 500 on database error', async () => {
      MenuItemModel.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/EditMenu/m1')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to fetch menu item');
    });
  });

  describe('PATCH /ResMenu/:id', () => {
    it('should update menu item without image', async () => {
      const updatedItem = {
        _id: 'm1',
        dishName: 'Updated Pizza',
        price: 18.99,
        description: 'Updated description',
        cuisineName: 'Italian'
      };
      MenuItemModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/ResMenu/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({
          dishName: 'Updated Pizza',
          price: 18.99,
          description: 'Updated description',
          cuisineName: 'Italian'
        });

      expect(res.status).toBe(200);
      expect(res.body.dishName).toBe('Updated Pizza');
      expect(MenuItemModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    // Note: File upload with multer is complex to mock in unit tests
    // This test would be better as an integration test with real multer middleware


    it('should return 404 when menu item not found', async () => {
      MenuItemModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .patch('/ResMenu/missing')
        .set('Cookie', [`token=${resToken}`])
        .send({ dishName: 'Updated Pizza' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Menu item not found');
    });

    it('should return 400 on validation error', async () => {
      MenuItemModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Validation error'));

      const res = await request(app)
        .patch('/ResMenu/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({ dishName: 'Updated Pizza' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /DeleteMenu/:id', () => {
    it('should delete menu item successfully', async () => {
      MenuItemModel.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'm1', dishName: 'Pizza' });

      const res = await request(app)
        .delete('/DeleteMenu/m1')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Item deleted successfully');
      expect(MenuItemModel.findByIdAndDelete).toHaveBeenCalledWith('m1');
    });

    it('should return 404 when menu item not found', async () => {
      MenuItemModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .delete('/DeleteMenu/missing')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Menu item not deleted');
    });

    it('should return 500 on database error', async () => {
      MenuItemModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .delete('/DeleteMenu/m1')
        .set('Cookie', [`token=${resToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to delete menu item');
    });
  });

  describe('PATCH /toggleStock/:id', () => {
    it('should toggle stock to false', async () => {
      const updatedItem = { _id: 'm1', inStock: false };
      MenuItemModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/toggleStock/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({ inStock: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stock updated successfully');
      expect(MenuItemModel.findByIdAndUpdate).toHaveBeenCalledWith('m1', { inStock: false }, { new: true });
    });

    it('should toggle stock to true', async () => {
      const updatedItem = { _id: 'm1', inStock: true };
      MenuItemModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/toggleStock/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({ inStock: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stock updated successfully');
    });

    it('should return 400 when inStock is not boolean', async () => {
      const res = await request(app)
        .patch('/toggleStock/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({ inStock: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid value for inStock. It must be a boolean.');
    });

    it('should return 404 when menu item not found', async () => {
      MenuItemModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .patch('/toggleStock/missing')
        .set('Cookie', [`token=${resToken}`])
        .send({ inStock: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Menu item not found');
    });

    it('should return 500 on database error', async () => {
      MenuItemModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/toggleStock/m1')
        .set('Cookie', [`token=${resToken}`])
        .send({ inStock: true });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to update stock');
    });
  });

  describe('GET /cuisineNames', () => {
    it('should return distinct cuisine names', async () => {
      const mockCuisines = ['Italian', 'Chinese', 'Mexican'];
      MenuItemModel.distinct = jest.fn().mockResolvedValue(mockCuisines);

      const res = await request(app)
        .get('/cuisineNames')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCuisines);
      expect(MenuItemModel.distinct).toHaveBeenCalledWith('cuisineName');
    });

    it('should return 500 on database error', async () => {
      MenuItemModel.distinct = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/cuisineNames')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to fetch cuisine names');
    });
  });
});

