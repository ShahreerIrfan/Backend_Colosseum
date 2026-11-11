import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthRepository from '@repositories/authRepository.js';
import * as AuthDTO from '@dtos/authDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { EnvConstant, MessageConstants } from '@constants/allConstant.js';

import { assertCanManageAccountRole, resolveAccountRole } from './managedRoles.js';

const Message = MessageConstants.errorMessage.authService;

export default class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async SignUp(data: Omit<AuthDTO.SignUp, 'role' | 'assignedFloorIds'>): Promise<AuthDTO.AuthResponse> {
    const user = await this.createAccount({ ...data, role: 'USER', assignedFloorIds: [] });
    const userRole = user.role.toLowerCase();
    const { name: roleName, permissions: rback } = await resolveAccountRole(user.role);

    const payload: AuthDTO.AuthPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedFloorIds: user.assignedFloorIds || [],
      userRole,
      roleName,
      rback,
    };

    const token = this.generateToken(payload);

    return {
      token,
      user: payload,
    };
  }

  async SignIn(data: AuthDTO.SignIn): Promise<AuthDTO.AuthResponse> {
    const userDoc = await this.authRepository.FindByEmail(data.email);
    if (!userDoc) {
      throw new Error.AuthenticationError(Message.invalidCredential);
    }

    if (!userDoc.is_active) {
      throw new Error.AuthenticationError('Your account has been deactivated');
    }

    const isMatch = await bcrypt.compare(data.password, userDoc.password);
    if (!isMatch) {
      throw new Error.AuthenticationError(Message.invalidCredential);
    }

    const userRole = userDoc.role.toLowerCase();
    const { name: roleName, permissions: rback } = await resolveAccountRole(userDoc.role);

    const payload: AuthDTO.AuthPayload = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role as AuthDTO.Role,
      assignedFloorIds: userDoc.assignedFloorIds || [],
      userRole,
      roleName,
      rback,
    };

    const token = this.generateToken(payload);

    return {
      token,
      user: payload,
    };
  }

  async GetProfile(userId: string) {
    const user = await this.authRepository.FindById(userId);
    if (!user) {
      throw new Error.NotFoundError(Message.userNotFound);
    }
    const { name: roleName, permissions: rback } = await resolveAccountRole(user.role);
    return { ...user, userRole: user.role.toLowerCase(), roleName, rback };
  }

  async ChangePassword(userId: string, data: AuthDTO.ChangePassword): Promise<boolean> {
    const user = await this.authRepository.FindById(userId);
    if (!user) {
      throw new Error.NotFoundError(Message.userNotFound);
    }

    const fullUser = await this.authRepository.FindByEmail(user.email);
    const isMatch = await bcrypt.compare(data.currentPassword, fullUser.password);
    if (!isMatch) {
      throw new Error.BadRequestError('Current password does not match');
    }

    const newHashed = await bcrypt.hash(data.newPassword, 10);
    return this.authRepository.UpdatePassword(userId, newHashed);
  }

  async GetAllUsers(query: { page?: number; limit?: number }) {
    return this.authRepository.GetAll(query);
  }

  async CreateUser(actor: AuthDTO.AuthPayload, data: AuthDTO.SignUp): Promise<AuthDTO.User> {
    await assertCanManageAccountRole(actor, data.role, true);
    return this.createAccount(data);
  }

  private async createAccount(data: AuthDTO.SignUp): Promise<AuthDTO.User> {
    if (await this.authRepository.FindByEmail(data.email)) {
      throw new Error.ConflictError(Message.userAlreadyExists);
    }
    try {
      return await this.authRepository.Create({ ...data, password: await bcrypt.hash(data.password, 10) });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        throw new Error.ConflictError(Message.userAlreadyExists);
      }
      throw error;
    }
  }

  async UpdateUserDetails(actor: AuthDTO.AuthPayload, userId: string, data: AuthDTO.UpdateUserDetails) {
    const user = await this.authRepository.FindById(userId);
    if (!user) throw new Error.NotFoundError(Message.userNotFound);
    if (actor.id === userId) {
      if ((data.role && data.role !== user.role) || data.is_active === false) {
        throw new Error.AuthorizationError('You cannot change your own role or deactivate your account.');
      }
    } else {
      await assertCanManageAccountRole(actor, user.role);
    }
    if (data.role && data.role !== user.role) await assertCanManageAccountRole(actor, data.role, true);
    const updated = await this.authRepository.Update(userId, data, user.role);
    if (!updated) throw new Error.ConflictError('The account changed. Reload and try again.');
    return updated;
  }

  async RemoveUser(actor: AuthDTO.AuthPayload, userId: string): Promise<boolean> {
    if (actor.id === userId) throw new Error.AuthorizationError('You cannot delete your own account.');
    const user = await this.authRepository.FindById(userId);
    if (!user) throw new Error.NotFoundError(Message.userNotFound);
    await assertCanManageAccountRole(actor, user.role);
    const removed = await this.authRepository.Remove(userId, user.role);
    if (!removed) throw new Error.ConflictError('The account changed. Reload and try again.');
    return removed;
  }

  private generateToken(payload: AuthDTO.AuthPayload): string {
    const secret = EnvConstant.JWT_SECRET;
    const expiresIn = EnvConstant.JWT_EXPIRES_IN;
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }
}
