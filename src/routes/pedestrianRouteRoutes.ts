import express, { Router } from 'express';
import PedestrianRouteController from '@controllers/pedestrianRouteController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as PedestrianRouteDTO from '@dtos/pedestrianRouteDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const pedestrianRouteController = new PedestrianRouteController();

// Find connecting route between two landmarks
router.get('/find', pedestrianRouteController.FindRoute);

router
  .route('/')
  .get(
    Validator.query(PedestrianRouteDTO.QueryPedestrianRouteSchema),
    cacheMiddleware('routes:pedestrian'),
    pedestrianRouteController.GetAllRoutes
  )
  .post(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN'),
    Validator.body(PedestrianRouteDTO.CreatePedestrianRouteSchema),
    pedestrianRouteController.CreateRoute
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('route:pedestrian'), pedestrianRouteController.GetRouteByID)
  .patch(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN'),
    Validator.body(PedestrianRouteDTO.UpdatePedestrianRouteSchema),
    pedestrianRouteController.UpdateRoute
  )
  .delete(
    authenticateToken,
    authorizeRole.adminOnly,
    pedestrianRouteController.RemoveRoute
  );

export default router;
