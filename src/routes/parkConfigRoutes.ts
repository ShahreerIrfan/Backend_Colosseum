import express, { Router } from 'express';
import ParkConfigController from '@controllers/parkConfigController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as ParkConfigDTO from '@dtos/parkConfigDTO.js';

const router: Router = express.Router();
const parkConfigController = new ParkConfigController();

router
  .route('/')
  .get(cacheMiddleware('park:config'), parkConfigController.GetConfig)
  .patch(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN'),
    Validator.body(ParkConfigDTO.UpdateParkConfigSchema),
    parkConfigController.UpdateConfig
  );

export default router;
