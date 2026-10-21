import jwt from 'jsonwebtoken';
import { EnvConstant, MessageConstants } from '@constants/allConstant.js';
import type { JwtPayload } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import * as Error from '@errors/concreteErrors.js';
import * as AuthDTO from '@dtos/authDTO.js';

const Message = MessageConstants.errorMessage.authService;

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

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload as AuthDTO.AuthPayload;
    next();
  } catch {
    next(new Error.AuthenticationError(Message.invalidCredential));
  }
};

export default authenticateToken;
