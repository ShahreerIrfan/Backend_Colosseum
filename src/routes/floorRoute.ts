import express, { Router } from 'express';
import FloorController from '@controllers/floorController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as FloorDTO from '@dtos/floorDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const floorController = new FloorController();

router
  .route('/')
  .get(
    Validator.query(FloorDTO.QueryFloorSchema),
    cacheMiddleware('floors'),
    floorController.GetAllFloors
  )
  .post(
    authenticateToken,
    managedRolePermission('Vector Floor Maps', 'Create', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(FloorDTO.CreateFloorSchema),
    floorController.CreateFloor
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('floor'), floorController.GetFloorByID)
  .patch(
    authenticateToken,
    managedRolePermission('Vector Floor Maps', 'Update', authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')),
    Validator.body(FloorDTO.UpdateFloorSchema),
    floorController.UpdateFloor
  )
  .delete(authenticateToken, managedRolePermission('Vector Floor Maps', 'Delete', authorizeRole.adminOnly), floorController.RemoveFloor);

export default router;
