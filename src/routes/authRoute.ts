import express, { Router } from 'express';
import AuthController from '@controllers/authController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import * as AuthDTO from '@dtos/authDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const authController = new AuthController();

router.post('/signup', Validator.body(AuthDTO.signUpSchema), authController.SignUp);
router.post('/signin', Validator.body(AuthDTO.signInSchema), authController.SignIn);
router.post('/logout', authenticateToken, authController.Logout);
router.get('/profile', authenticateToken, authController.GetProfile);
router.post(
  '/change-password',
  authenticateToken,
  Validator.body(AuthDTO.changePasswordSchema),
  authController.ChangePassword
);

router.get('/users', authenticateToken, authorizeRole.adminOnly, authController.GetAllUsers);
router.put(
  '/users/:id',
  authenticateToken,
  authorizeRole.adminOnly,
  Validator.params(CommonItemDTO.IdSchema),
  Validator.body(AuthDTO.updateUserDetailsSchema),
  authController.UpdateUserDetails
);
router.patch(
  '/users/:id/role',
  authenticateToken,
  authorizeRole.adminOnly,
  Validator.params(CommonItemDTO.IdSchema),
  Validator.body(AuthDTO.updateUserRoleSchema),
  authController.UpdateUserRole
);
router.delete(
  '/users/:id',
  authenticateToken,
  authorizeRole.adminOnly,
  Validator.params(CommonItemDTO.IdSchema),
  authController.RemoveUser
);

export default router;
