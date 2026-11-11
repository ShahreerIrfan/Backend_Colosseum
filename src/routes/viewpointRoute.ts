import express, { Router } from 'express';
import ViewpointController from '@controllers/viewpointController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
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
    managedRolePermission('Viewpoint Hotspots', 'Create', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(ViewpointDTO.CreateViewpointSchema),
    managedRolePermission('Viewpoint Hotspots', 'Create', authorizeRole.requireFloorAssignment()),
    viewpointController.CreateViewpoint
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('viewpoint'), viewpointController.GetViewpointByID)
  .patch(
    authenticateToken,
    managedRolePermission('Viewpoint Hotspots', 'Update', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(ViewpointDTO.UpdateViewpointSchema),
    viewpointController.UpdateViewpoint
  )
  .delete(authenticateToken, managedRolePermission('Viewpoint Hotspots', 'Delete', authorizeRole.adminOnly), viewpointController.RemoveViewpoint);

export default router;
