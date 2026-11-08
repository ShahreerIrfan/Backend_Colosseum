import express, { Router, Request, Response } from 'express';
import authRoute from './authRoute.js';
import landmarkRoute from './landmarkRoute.js';
import viewpointRoute from './viewpointRoute.js';
import audioRoute from './audioRoute.js';
import ticketRoute from './ticketRoute.js';
import syncRoute from './syncRoute.js';
import pedestrianRouteRoutes from './pedestrianRouteRoutes.js';
import parkConfigRoutes from './parkConfigRoutes.js';
import uploadRoute from './uploadRoute.js';
import floorRoute from './floorRoute.js';
import SyncController from '@controllers/syncController.js';

const router: Router = express.Router();
const syncController = new SyncController();

// Domain-scoped sub-routes
router.use('/auth', authRoute);
router.use('/landmarks', landmarkRoute);
router.use('/floors', floorRoute);
router.use('/viewpoints', viewpointRoute);
router.use('/audio', audioRoute);
router.use('/tickets', ticketRoute);
router.use('/sync', syncRoute);
router.use('/routes/pedestrian', pedestrianRouteRoutes);
router.use('/pedestrian-routes', pedestrianRouteRoutes);
router.use('/park/config', parkConfigRoutes);
router.use('/park-config', parkConfigRoutes);
router.use('/uploads', uploadRoute);

// System health check
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'colosseum-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Backward-compatible endpoints for mobile client & tests
router.get('/tours/bundle', syncController.GetTourBundle);
router.get('/languages', syncController.GetLanguages);

export default router;
