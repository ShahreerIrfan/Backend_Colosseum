import express, { Router } from 'express';
import LandmarkController from '@controllers/landmarkController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
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
    managedRolePermission('Monuments & Landmarks', 'Create', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(LandmarkDTO.CreateLandmarkSchema),
    landmarkController.CreateLandmark
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('landmark'), landmarkController.GetLandmarkByID)
  .patch(
    authenticateToken,
    managedRolePermission('Monuments & Landmarks', 'Update', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(LandmarkDTO.UpdateLandmarkSchema),
    landmarkController.UpdateLandmark
  )
  .delete(authenticateToken, managedRolePermission('Monuments & Landmarks', 'Delete', authorizeRole.adminOnly), landmarkController.RemoveLandmark);

export default router;
