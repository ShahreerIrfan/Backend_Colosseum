import express, { Router } from 'express';
import AuthController from '@controllers/authController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { z } from 'zod';
import * as AuthDTO from '@dtos/authDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const authController = new AuthController();

router.post('/signup', Validator.body(AuthDTO.publicSignUpSchema), authController.SignUp);
router.post('/signin', Validator.body(AuthDTO.signInSchema), authController.SignIn);
router.post('/logout', authenticateToken, authController.Logout);
router.get('/profile', authenticateToken, authController.GetProfile);
router.post(
  '/change-password',
  authenticateToken,
  Validator.body(AuthDTO.changePasswordSchema),
  authController.ChangePassword
);

const users = 'Staff & User Accounts';
router.get('/users', authenticateToken, requirePermission(users, 'Read'),
  Validator.query(z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })), authController.GetAllUsers);
router.post('/users', authenticateToken, requirePermission(users, 'Create'),
  Validator.body(AuthDTO.createUserSchema), authController.CreateUser);
router.put(
  '/users/:id',
  authenticateToken,
  requirePermission(users, 'Update'),
  Validator.params(CommonItemDTO.IdSchema),
  Validator.body(AuthDTO.updateUserDetailsSchema),
  authController.UpdateUserDetails
);
router.patch(
  '/users/:id/role',
  authenticateToken,
  requirePermission(users, 'Update'),
  Validator.params(CommonItemDTO.IdSchema),
  Validator.body(AuthDTO.updateUserRoleSchema),
  authController.UpdateUserRole
);
router.delete(
  '/users/:id',
  authenticateToken,
  requirePermission(users, 'Delete'),
  Validator.params(CommonItemDTO.IdSchema),
  authController.RemoveUser
);

export default router;
