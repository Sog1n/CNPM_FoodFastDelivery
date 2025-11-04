import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import ResRouter from '../../routes/ResRoutes.js';
import UserRoutes from '../../routes/UserRoutes.js';
import DelRoutes from '../../routes/DelRoutes.js';
import menuRoutes from '../../routes/menuRoutes.js';
import paymentRouter from '../../routes/paymentRoutes.js';
import addressRoutes from '../../routes/AddressRoutes.js';
import orderRoutes from '../../routes/OrderRoutes.js';
import DroneRoutes from '../../routes/DroneRoutes.js';

dotenv.config();

let mongoServer;
let app;

/**
 * Setup test environment before all tests
 */
export const setupTestEnvironment = async () => {
  // Set test environment variables
  process.env.KEY = process.env.KEY || 'test-key-for-integration';
  process.env.NODE_ENV = 'test';

  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to in-memory database
  await mongoose.connect(mongoUri);

  // Create Express app with all routes
  app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Register routes
  app.use('/auth', ResRouter);
  app.use('/auth', UserRoutes);
  app.use('/auth', DelRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/payment', paymentRouter);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/order', orderRoutes);
  app.use('/api/drones', DroneRoutes);

  return app;
};

/**
 * Get the Express app instance
 */
export const getApp = () => app;

/**
 * Cleanup test environment after all tests
 */
export const teardownTestEnvironment = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections in the database
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

