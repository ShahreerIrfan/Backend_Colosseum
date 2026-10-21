import express, { Router } from 'express';
import ViewpointController from '@controllers/viewpointController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as ViewpointDTO from '@dtos/viewpointDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const viewpointController = new ViewpointController();

router
  .route('/')
  .get(
    Validator.query(ViewpointDTO.QueryViewpointSchema),
    cacheMiddleware('viewpoints'),
    viewpointController.GetAllViewpoints
  )
  .post(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(ViewpointDTO.CreateViewpointSchema),
    authorizeRole.requireFloorAssignment(),
    viewpointController.CreateViewpoint
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('viewpoint'), viewpointController.GetViewpointByID)
  .patch(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(ViewpointDTO.UpdateViewpointSchema),
    authorizeRole.requireFloorAssignment(),
    viewpointController.UpdateViewpoint
  )
  .delete(authenticateToken, authorizeRole.adminOnly, viewpointController.RemoveViewpoint);

export default router;
