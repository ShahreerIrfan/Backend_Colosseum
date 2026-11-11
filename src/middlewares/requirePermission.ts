import type { RequestHandler } from 'express';
import type { CrudAction, SystemModuleName } from '@constants/rbacConstants.js';
import { AuthenticationError, AuthorizationError } from '@errors/concreteErrors.js';
import { can } from '@services/managedRoles.js';

export function requirePermission(resource: SystemModuleName, action: CrudAction): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthenticationError());
    if (!can(req.user, resource, action)) return next(new AuthorizationError());
    next();
  };
}

export function managedRolePermission(
  resource: SystemModuleName, action: CrudAction, existing: RequestHandler,
): RequestHandler {
  const check = requirePermission(resource, action);
  return (req, res, next) => req.user?.role === 'ADMIN' || req.user?.role.startsWith('CUSTOM_')
    ? check(req, res, next)
    : existing(req, res, next);
}
