import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Provide a module factory mock for DroneModel before importing it
jest.mock('../../models/DroneModel.js', () => {
  class MockDrone {
    constructor(data) {
      Object.assign(this, data);
    }
  }
  // static methods that'll be overridden in tests
  MockDrone.find = jest.fn();
  MockDrone.findById = jest.fn();
  MockDrone.findByIdAndUpdate = jest.fn();
  MockDrone.findByIdAndDelete = jest.fn();
  MockDrone.insertMany = jest.fn();
  // default save implementation (can be overridden per-test)
  MockDrone.prototype.save = jest.fn().mockImplementation(function () {
    return Promise.resolve(this);
  });

  return {
    __esModule: true,
    default: MockDrone
  };
});

import DroneModel from '../../models/DroneModel.js';
import router from '../../routes/DroneRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/drones', router);

describe('DroneRoutes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/drones', () => {
    it('should create a new drone successfully', async () => {
      // Ensure save resolves with the instance
      DroneModel.prototype.save = jest.fn().mockImplementation(function () { return Promise.resolve(this); });

      const droneData = {
        droneId: 'D1',
        status: 'AVAILABLE',
        batteryLevel: 100,
        maxPayload: 5
      };

      const res = await request(app).post('/api/drones').send(droneData);

      expect(res.status).toBe(201);
      expect(res.body.droneId).toBe(droneData.droneId);
      expect(DroneModel.prototype.save).toHaveBeenCalled();
    });

    it('should return 400 when save fails (validation)', async () => {
      DroneModel.prototype.save = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const res = await request(app).post('/api/drones').send({ droneId: 'D2' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/drones', () => {
    it('should return all drones', async () => {
      const list = [ { droneId: 'D1' }, { droneId: 'D2' } ];
      DroneModel.find = jest.fn().mockResolvedValue(list);

      const res = await request(app).get('/api/drones');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(DroneModel.find).toHaveBeenCalled();
    });
  });

  describe('GET /api/drones/:id', () => {
    it('should return drone when found', async () => {
      const drone = { _id: 'id1', droneId: 'D1' };
      DroneModel.findById = jest.fn().mockResolvedValue(drone);

      const res = await request(app).get('/api/drones/id1');

      expect(res.status).toBe(200);
      expect(res.body.droneId).toBe('D1');
    });

    it('should return 404 when not found', async () => {
      DroneModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).get('/api/drones/missing');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Drone not found');
    });

    it('should return 500 on error', async () => {
      DroneModel.findById = jest.fn().mockRejectedValue(new Error('bad id'));

      const res = await request(app).get('/api/drones/invalid');

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PUT /api/drones/:id', () => {
    it('should update when found', async () => {
      const updated = { _id: 'id1', status: 'MAINTENANCE', batteryLevel: 50 };
      DroneModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/drones/id1')
        .send({ status: 'MAINTENANCE', batteryLevel: 50 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('MAINTENANCE');
      expect(DroneModel.findByIdAndUpdate).toHaveBeenCalledWith('id1', { status: 'MAINTENANCE', batteryLevel: 50 }, { new: true, runValidators: true });
    });

    it('should return 404 when not found', async () => {
      DroneModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const res = await request(app).put('/api/drones/id2').send({ status: 'MAINTENANCE' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Drone not found');
    });

    it('should return 400 on validation error', async () => {
      DroneModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const res = await request(app).put('/api/drones/id3').send({ status: 'BAD' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/drones/:id', () => {
    it('should delete when found', async () => {
      DroneModel.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'id1' });

      const res = await request(app).delete('/api/drones/id1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Drone deleted');
    });

    it('should return 404 when not found', async () => {
      DroneModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const res = await request(app).delete('/api/drones/id2');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Drone not found');
    });

    it('should return 500 on error', async () => {
      DroneModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('delete error'));

      const res = await request(app).delete('/api/drones/error');

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/drones/:id/status', () => {
    it('should update status when found', async () => {
      const updated = { _id: 'id1', status: 'IN_DELIVERY' };
      DroneModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);

      const res = await request(app).patch('/api/drones/id1/status').send({ status: 'IN_DELIVERY' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_DELIVERY');
      expect(DroneModel.findByIdAndUpdate).toHaveBeenCalledWith('id1', { status: 'IN_DELIVERY' }, { new: true, runValidators: true });
    });

    it('should return 404 when not found', async () => {
      DroneModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const res = await request(app).patch('/api/drones/id2/status').send({ status: 'MAINTENANCE' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Drone not found');
    });

    it('should return 400 on invalid status', async () => {
      DroneModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const res = await request(app).patch('/api/drones/id3/status').send({ status: 'BAD' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
