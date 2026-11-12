import mongoose from 'mongoose';
import { EnvConstant } from '@constants/allConstant.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(EnvConstant.MONGODB_URI, {
      dbName: EnvConstant.MONGODB_DB_NAME,
      minPoolSize: EnvConstant.MONGODB_MIN_POOL_SIZE,
      maxPoolSize: EnvConstant.MONGODB_MAX_POOL_SIZE,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `🍃 MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );

    mongoose.connection.on('error', (err: Error) => {
      console.error('🍃 MongoDB Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🍃 MongoDB Disconnected');
    });

    return conn;
  } catch (error: any) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🍃 MongoDB connection closed.');
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error);
  }
};

export default mongoose;
