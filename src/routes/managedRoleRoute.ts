import { Router } from 'express';
import { z } from 'zod';
import { managedRoleSchema } from '@dtos/authDTO.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { Validator } from '@middlewares/requestValidator.js';
import { can, listRoles, removeRole, saveRole } from '@services/managedRoles.js';
import { AuthorizationError } from '@errors/concreteErrors.js';
import ResponseHandler from '@utils/responseHandler.js';

const router = Router();
const roles = 'Role-Based Access Control';
const users = 'Staff & User Accounts';
const params = Validator.params(z.object({ id: z.string().max(40) }));
router.use(authenticateToken);
router.get('/', async (req, res) => {
  const actor = req.user!;
  if (!can(actor, roles, 'Read') && !can(actor, users, 'Create') && !can(actor, users, 'Update')) {
    throw new AuthorizationError();
  }
  ResponseHandler.send(res, 200, { data: await listRoles() });
});
router.post('/', requirePermission(roles, 'Create'), Validator.body(managedRoleSchema), async (req, res) => {
  ResponseHandler.send(res, 201, { data: await saveRole(req.user!, req.validatedBody) });
});
router.put('/:id', requirePermission(roles, 'Update'), params, Validator.body(managedRoleSchema), async (req, res) => {
  ResponseHandler.send(res, 200, { data: await saveRole(req.user!, req.validatedBody, req.validatedParams.id) });
});
router.delete('/:id', requirePermission(roles, 'Delete'), params, async (req, res) => {
  await removeRole(req.user!, req.validatedParams.id);
  ResponseHandler.send(res, 200, { message: 'Role deleted.' });
});
export default router;
