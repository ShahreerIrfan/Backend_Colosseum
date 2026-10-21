import express, { Router } from 'express';
import SyncController from '@controllers/syncController.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';

const router: Router = express.Router();
const syncController = new SyncController();

// Offline synchronization & bundle endpoints
router.get('/manifest', cacheMiddleware('sync:manifest', 600), syncController.GetManifest);
router.get('/bundle', cacheMiddleware('sync:bundle', 1800), syncController.GetTourBundle);
router.get('/floors', cacheMiddleware('sync:floors', 1800), syncController.GetFloorsOverview);
router.get('/floors/:floorId', cacheMiddleware('sync:floor', 1800), syncController.GetFloorDetail);
router.get('/languages', cacheMiddleware('sync:languages', 3600), syncController.GetLanguages);

export default router;
