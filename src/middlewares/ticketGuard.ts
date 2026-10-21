import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { EnvConstant } from '@constants/allConstant.js';
import * as Error from '@errors/concreteErrors.js';
import * as TicketDTO from '@dtos/ticketDTO.js';

export const authenticateVisitor = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // If request already has an authenticated staff user, allow bypass
  if (req.user) {
    next();
    return;
  }

  const JWT_SECRET = EnvConstant.JWT_SECRET;
  let token: string | undefined = req.cookies?.colosseum_visitor_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token && req.headers['x-ticket-session']) {
    token = req.headers['x-ticket-session'] as string;
  }

  if (!token) {
    next(new Error.AuthenticationError('A valid ticket session is required to access this resource'));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
      next(new Error.ExpiredError('Ticket'));
      return;
    }

    req.ticketSession = decoded as TicketDTO.TicketSession;
    next();
  } catch {
    next(new Error.AuthenticationError('Invalid or expired ticket session'));
  }
};

export const optionalVisitor = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    next();
    return;
  }

  const JWT_SECRET = EnvConstant.JWT_SECRET;
  let token: string | undefined = req.cookies?.colosseum_visitor_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token && req.headers['x-ticket-session']) {
    token = req.headers['x-ticket-session'] as string;
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.expiresAt || new Date(decoded.expiresAt) >= new Date()) {
      req.ticketSession = decoded as TicketDTO.TicketSession;
    }
  } catch {
    // Ignore invalid optional token
  }

  next();
};

export const requireFloorEntitlement = (
  extractFloorId?: (req: Request) => string | undefined
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Staff bypass floor visitor entitlement checks
    if (req.user) {
      next();
      return;
    }

    if (!req.ticketSession) {
      next(new Error.AuthenticationError('Ticket session required to access floor details'));
      return;
    }

    const floorId =
      (extractFloorId ? extractFloorId(req) : undefined) ||
      req.validatedParams?.floorId ||
      req.validatedParams?.id ||
      req.params?.floorId ||
      req.params?.id ||
      req.query?.floorId ||
      req.body?.floorId;

    if (!floorId) {
      next();
      return;
    }

    if (req.ticketSession.tier === 'full_access') {
      next();
      return;
    }

    const allowed = req.ticketSession.allowedFloorIds || [];
    if (!allowed.includes(floorId)) {
      next(
        new Error.AuthorizationError(
          `Your ticket tier (${req.ticketSession.tier}) does not grant access to floor '${floorId}'. Upgrade required.`
        )
      );
      return;
    }

    next();
  };
};

export const requireTicketTier = (...allowedTiers: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user) {
      next();
      return;
    }

    if (!req.ticketSession) {
      next(new Error.AuthenticationError('Valid ticket session required'));
      return;
    }

    if (
      req.ticketSession.tier === 'full_access' ||
      allowedTiers.includes(req.ticketSession.tier)
    ) {
      next();
      return;
    }

    next(
      new Error.AuthorizationError(
        `Ticket tier '${req.ticketSession.tier}' does not satisfy required tiers: ${allowedTiers.join(', ')}`
      )
    );
  };
};

export const ticketGuard = {
  authenticateVisitor,
  optionalVisitor,
  requireFloorEntitlement,
  requireTicketTier,
};

export default ticketGuard;
