import express, { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from '@config/redis.js';
import authRoute from './authRoute.js';
import managedRoleRoute from './managedRoleRoute.js';
import landmarkRoute from './landmarkRoute.js';
import viewpointRoute from './viewpointRoute.js';
import audioRoute from './audioRoute.js';
import ticketRoute from './ticketRoute.js';
import syncRoute from './syncRoute.js';
import pedestrianRouteRoutes from './pedestrianRouteRoutes.js';
import uploadRoute from './uploadRoute.js';
import floorRoute from './floorRoute.js';
import floorItineraryRoute from './floorItineraryRoute.js';
import languageRoute from './languageRoute.js';
import analyticsRoute from './analyticsRoute.js';
import contentTranslationRoute from './contentTranslationRoute.js';
import SyncController from '@controllers/syncController.js';

const router: Router = express.Router();
const syncController = new SyncController();

// Domain-scoped sub-routes
router.use('/auth', authRoute);
router.use('/roles', managedRoleRoute);
router.use('/landmarks', landmarkRoute);
router.use('/floors', floorRoute);
router.use('/floor-itineraries', floorItineraryRoute);
router.use('/viewpoints', viewpointRoute);
router.use('/audio', audioRoute);
router.use('/tickets', ticketRoute);
router.use('/sync', syncRoute);
router.use('/routes/pedestrian', pedestrianRouteRoutes);
router.use('/pedestrian-routes', pedestrianRouteRoutes);
router.use('/uploads', uploadRoute);
router.use('/languages', languageRoute);
router.use('/analytics', analyticsRoute);
router.use('/translations', contentTranslationRoute);

// System health check
router.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'colosseum-backend',
    version: '1.0.0',
    database: isDbConnected ? 'connected' : 'disconnected',
    cache: redisClient.isOpen ? 'connected' : 'bypass',
    timestamp: new Date().toISOString(),
  });
});

// Backward-compatible endpoints for mobile client & tests
router.get('/tours/bundle', syncController.GetTourBundle);
router.get('/languages', syncController.GetLanguages);

export default router;
