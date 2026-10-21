import type { Request, Response, NextFunction } from 'express';
import redisClient from '@config/redis.js';

export const cacheMiddleware = (keyPrefix: string, ttlSeconds: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      return next();
    }

    if (!redisClient.isOpen) {
      return next();
    }

    const key = `${keyPrefix}:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      const originalJson = res.json.bind(res);

      res.json = ((body: any) => {
        if (redisClient.isOpen) {
          redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch((err) => {
            console.error('Redis Set Error:', err);
          });
        }
        return originalJson(body);
      }) as any;

      next();
    } catch {
      next(); // Fail gracefully: query database
    }
  };
};
