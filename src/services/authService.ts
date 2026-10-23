import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthRepository from '@repositories/authRepository.js';
import * as AuthDTO from '@dtos/authDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { EnvConstant, MessageConstants, RbacConstants } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.authService;

export default class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async SignUp(data: AuthDTO.SignUp): Promise<AuthDTO.AuthResponse> {
    const existing = await this.authRepository.FindByEmail(data.email);
    if (existing) {
      throw new Error.ConflictError(Message.userAlreadyExists);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await this.authRepository.Create({
      ...data,
      password: hashedPassword,
    });

    const userRole = user.role.toLowerCase();
    const rback = RbacConstants.getRoleRbac(user.role);

    const payload: AuthDTO.AuthPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedFloorIds: user.assignedFloorIds || [],
      userRole,
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
    const rback = RbacConstants.getRoleRbac(userDoc.role);

    const payload: AuthDTO.AuthPayload = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role as AuthDTO.Role,
      assignedFloorIds: userDoc.assignedFloorIds || [],
      userRole,
      rback,
    };

    const token = this.generateToken(payload);

    return {
      token,
      user: payload,
    };
  }

  async GetProfile(userId: string): Promise<AuthDTO.User> {
    const user = await this.authRepository.FindById(userId);
    if (!user) {
      throw new Error.NotFoundError(Message.userNotFound);
    }
    return user;
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

  async UpdateUserRole(userId: string, role: AuthDTO.Role): Promise<AuthDTO.User> {
    const user = await this.authRepository.FindById(userId);
    if (!user) {
      throw new Error.NotFoundError(Message.userNotFound);
    }
    const updated = await this.authRepository.Update(userId, { role });
    if (!updated) {
      throw new Error.NotFoundError(Message.userNotFound);
    }
    return updated;
  }

  async RemoveUser(userId: string): Promise<boolean> {
    const user = await this.authRepository.FindById(userId);
    if (!user) {
      throw new Error.NotFoundError(Message.userNotFound);
    }
    return this.authRepository.Remove(userId);
  }

  private generateToken(payload: AuthDTO.AuthPayload): string {
    const secret = EnvConstant.JWT_SECRET;
    const expiresIn = EnvConstant.JWT_EXPIRES_IN;
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }
}
