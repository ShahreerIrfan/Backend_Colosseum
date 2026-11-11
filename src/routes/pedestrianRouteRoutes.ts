import express, { Router } from 'express';
import PedestrianRouteController from '@controllers/pedestrianRouteController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as PedestrianRouteDTO from '@dtos/pedestrianRouteDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const pedestrianRouteController = new PedestrianRouteController();

// Find connecting route between two landmarks
router.get('/find', pedestrianRouteController.FindRoute);
router.get(
  '/admin/list',
  authenticateToken,
  managedRolePermission('Pedestrian Street Routes', 'Read', authorizeRole.adminOnly),
  Validator.query(PedestrianRouteDTO.QueryPedestrianRouteSchema),
  pedestrianRouteController.GetAdminRoutes
);

router
  .route('/')
  .get(
    Validator.query(PedestrianRouteDTO.QueryPedestrianRouteSchema),
    cacheMiddleware('routes:pedestrian'),
    pedestrianRouteController.GetAllRoutes
  )
  .post(
    authenticateToken,
    managedRolePermission('Pedestrian Street Routes', 'Create', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN')),
    Validator.body(PedestrianRouteDTO.CreatePedestrianRouteSchema),
    pedestrianRouteController.CreateRoute
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('route:pedestrian'), pedestrianRouteController.GetRouteByID)
  .patch(
    authenticateToken,
    managedRolePermission('Pedestrian Street Routes', 'Update', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN')),
    Validator.body(PedestrianRouteDTO.UpdatePedestrianRouteSchema),
    pedestrianRouteController.UpdateRoute
  )
  .delete(
    authenticateToken,
    managedRolePermission('Pedestrian Street Routes', 'Delete', authorizeRole.adminOnly),
    pedestrianRouteController.RemoveRoute
  );

export default router;
