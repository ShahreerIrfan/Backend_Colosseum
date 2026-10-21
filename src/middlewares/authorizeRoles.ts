import type { Request, Response, NextFunction } from 'express';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';
import * as AuthDTO from '@dtos/authDTO.js';

const Message = MessageConstants.errorMessage.authService;

export const adminOnly = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next(new Error.AuthenticationError(Message.unauthorized));
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    next(new Error.AuthorizationError(Message.forbidden));
    return;
  }

  next();
};

export const hasRole = (...roles: AuthDTO.Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new Error.AuthenticationError(Message.unauthorized));
      return;
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || roles.includes(req.user.role)) {
      next();
      return;
    }

    next(new Error.AuthorizationError(Message.forbidden));
  };
};

export const requireStaff = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next(new Error.AuthenticationError(Message.unauthorized));
    return;
  }

  const staffRoles: AuthDTO.Role[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'MODERATOR',
  ];
  if (!staffRoles.includes(req.user.role)) {
    next(new Error.AuthorizationError(Message.forbidden));
    return;
  }

  next();
};

export const userAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next(new Error.AuthenticationError(Message.unauthorized));
    return;
  }

  if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  const targetId = req.validatedParams?.id;
  if (targetId && req.user.id !== targetId) {
    next(new Error.AuthorizationError('You can only access or modify your own account'));
    return;
  }

  next();
};

export const requireFloorAssignment = (
  extractFloorId?: (req: Request) => string | undefined
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new Error.AuthenticationError(Message.unauthorized));
      return;
    }

    // Super Admin and Admin bypass all assignment restrictions
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Moderators must be assigned to the target floor if restricted
    if (req.user.role === 'MODERATOR') {
      const floorId =
        (extractFloorId ? extractFloorId(req) : undefined) ||
        req.validatedParams?.floorId ||
        req.validatedParams?.id ||
        req.validatedBody?.floorId ||
        req.validatedBody?.floor_id ||
        req.params?.floorId ||
        req.params?.id ||
        req.body?.floorId;

      if (!floorId) {
        next();
        return;
      }

      const assigned = req.user.assignedFloorIds || [];
      if (!assigned.includes(floorId)) {
        next(
          new Error.AuthorizationError(
            `Access denied. Moderator is not assigned to manage floor '${floorId}'.`
          )
        );
        return;
      }

      next();
      return;
    }

    next(new Error.AuthorizationError(Message.forbidden));
  };
};

export const authorizeRole = {
  adminOnly,
  hasRole,
  requireStaff,
  userAccess,
  requireFloorAssignment,
};

export default authorizeRole;
