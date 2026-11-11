import jwt from 'jsonwebtoken';
import { EnvConstant, MessageConstants } from '@constants/allConstant.js';
import type { Request, Response, NextFunction } from 'express';
import * as Error from '@errors/concreteErrors.js';
import * as AuthDTO from '@dtos/authDTO.js';
import AuthRepository from '@repositories/authRepository.js';
import { resolvePermissions } from '@services/managedRoles.js';

const Message = MessageConstants.errorMessage.authService;
const accounts = new AuthRepository();

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const JWT_SECRET = EnvConstant.JWT_SECRET;

  if (!JWT_SECRET) {
    next(new Error.AuthenticationError(Message.invalidCredential));
    return;
  }

  let token: string | undefined = req.cookies?.authToken;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    next(new Error.AuthenticationError(Message.unauthorized));
    return;
  }

  let session: AuthDTO.AuthPayload;
  try {
    session = AuthDTO.authPayloadSchema.parse(jwt.verify(token, JWT_SECRET));
  } catch {
    return next(new Error.AuthenticationError(Message.invalidCredential));
  }
  if (!/^[a-f0-9]{24}$/i.test(session.id)) return next(new Error.AuthenticationError(Message.invalidCredential));
  const account = await accounts.FindById(session.id);
  if (!account?.is_active) return next(new Error.AuthenticationError(Message.invalidCredential));
  req.user = { ...account, userRole: account.role.toLowerCase(), rback: await resolvePermissions(account.role) };
  next();
};

export default authenticateToken;
