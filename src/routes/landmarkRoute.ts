import express, { Router } from 'express';
import LandmarkController from '@controllers/landmarkController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as LandmarkDTO from '@dtos/landmarkDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const landmarkController = new LandmarkController();

router
  .route('/')
  .get(
    Validator.query(LandmarkDTO.QueryLandmarkSchema),
    cacheMiddleware('landmarks'),
    landmarkController.GetAllLandmarks
  )
  .post(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(LandmarkDTO.CreateLandmarkSchema),
    landmarkController.CreateLandmark
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('landmark'), landmarkController.GetLandmarkByID)
  .patch(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(LandmarkDTO.UpdateLandmarkSchema),
    landmarkController.UpdateLandmark
  )
  .delete(authenticateToken, authorizeRole.adminOnly, landmarkController.RemoveLandmark);

export default router;
