import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http, { Server } from 'node:http';
import { EnvConstant } from '@constants/allConstant.js';
import { errorHandler } from '@middlewares/errorHandler.js';
import router from '@routes/index.js';
import { connectDB, disconnectDB } from '@config/db.js';
import { connectRedis, disconnectRedis } from '@config/redis.js';
import { ensureEnvAdminUser } from '@services/bootstrapAdmin.js';
import { autoSeedIfEmpty } from './scripts/seedDatabase.js';

const app = express();
const server: Server = http.createServer(app);

// Trust reverse proxy headers (e.g. Dokploy Traefik TLS termination)
app.set('trust proxy', 1);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or reflect caller origin in development
      if (!origin || EnvConstant.CORS_ORIGIN === '*' || EnvConstant.CORS_ORIGIN === 'true') {
        return callback(null, true);
      }

      const allowedOrigins = EnvConstant.CORS_ORIGIN.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base informational endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Colosseum Audio Tour Backend API',
    version: '1.0.0',
    documentation: `${EnvConstant.API_PREFIX}/health`,
    status: 'running',
  });
});

// Mount domain routes under API prefix
app.use(EnvConstant.API_PREFIX, router);

// Global Error Handler
app.use(errorHandler);

// Server startup
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await autoSeedIfEmpty();
    await ensureEnvAdminUser();
    await connectRedis();

    server.listen(EnvConstant.PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 Colosseum Backend running on port ${EnvConstant.PORT}`);
      console.log(`📡 Environment: ${EnvConstant.NODE_ENV}`);
      console.log(`🔗 Base URL: http://0.0.0.0:${EnvConstant.PORT}`);
      console.log(
        `🩺 Health check: http://127.0.0.1:${EnvConstant.PORT}${EnvConstant.API_PREFIX}/health`
      );
      console.log(
        `📦 Tour Bundle: http://127.0.0.1:${EnvConstant.PORT}${EnvConstant.API_PREFIX}/sync/bundle`
      );
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  const forceExitTimer = setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async () => {
    await Promise.all([disconnectDB(), disconnectRedis()]);
    clearTimeout(forceExitTimer);
    console.log('Server closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
