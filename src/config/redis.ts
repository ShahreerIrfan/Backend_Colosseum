import { createClient } from 'redis';
import { EnvConstant } from '@constants/allConstant.js';

const redisClient = createClient({
  url: EnvConstant.REDIS_URL,
  socket: {
    connectTimeout: 3000,
    reconnectStrategy: false,
  },
  disableOfflineQueue: true,
});

redisClient.on('error', () => {
  // Handle Redis connection error without crashing the process
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully!');
  } catch {
    console.warn('⚠️ Redis not available. Running with cache bypass.');
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('Redis connection closed.');
    }
  } catch {
    // Ignore errors during shutdown
  }
};

export default redisClient;
