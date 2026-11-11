import express, { Router } from 'express';
import SyncController from '@controllers/syncController.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { Validator } from '@middlewares/requestValidator.js';
import { z } from 'zod';

const router: Router = express.Router();
const syncController = new SyncController();

// Offline synchronization & bundle endpoints
router.get('/manifest', syncController.GetManifest);
router.post('/revalidate', authenticateToken, authorizeRole.adminOnly, Validator.body(z.object({
  packageVersion: z.string().trim().max(64).regex(/^\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?$/).optional(),
}).default({})), syncController.RevalidateContent);
router.get('/bundle', syncController.GetTourBundle);
router.get('/floors', cacheMiddleware('sync:floors', 1800), syncController.GetFloorsOverview);
router.get('/floors/:floorId', cacheMiddleware('sync:floor', 1800), syncController.GetFloorDetail);
router.get('/languages', cacheMiddleware('sync:languages', 3600), syncController.GetLanguages);

export default router;
