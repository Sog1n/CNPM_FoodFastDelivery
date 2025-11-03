/**
 * Migration script to add unique index on paymentId in Order collection
 * Run this once to ensure existing database has the unique constraint
 *
 * Usage: node migrations/add-payment-unique-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderModel from '../models/OrderModel.js';

dotenv.config();

const addUniqueIndex = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check for duplicate paymentIds before adding index
    const duplicates = await OrderModel.aggregate([
      {
        $group: {
          _id: "$paymentId",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length > 0) {
      console.log('⚠️ Found duplicate paymentIds:');
      console.log(duplicates);
      console.log('\n⚠️ Please clean up duplicates before adding unique index');
      console.log('You can run: node migrations/remove-duplicate-orders.js');
      process.exit(1);
    }

    // Add unique index
    await OrderModel.collection.createIndex({ paymentId: 1 }, { unique: true });
    console.log('✅ Successfully added unique index on paymentId');

    // Verify index was created
    const indexes = await OrderModel.collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding unique index:', error);
    process.exit(1);
  }
};

addUniqueIndex();

