import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  authenticateVisitor,
  requireFloorEntitlement,
  requireTicketTier,
} from '@middlewares/ticketGuard.js';
import { EnvConstant } from '@constants/allConstant.js';
import * as Error from '@errors/concreteErrors.js';

describe('ticketGuard Middleware', () => {
  const secret = EnvConstant.JWT_SECRET || 'test-secret';

  describe('authenticateVisitor', () => {
    it('should reject when no token is present and req.user is undefined', async () => {
      const req: any = { headers: {}, cookies: {} };
      const res: any = {};
      const next = vi.fn();

      await authenticateVisitor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthenticationError));
    });

    it('should bypass when req.user (staff) is already authenticated', async () => {
      const req: any = { headers: {}, cookies: {}, user: { id: 'staff_1', role: 'CURATOR' } };
      const res: any = {};
      const next = vi.fn();

      await authenticateVisitor(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should attach ticketSession when valid visitor token is provided in Authorization header', async () => {
      const session = {
        ticketToken: 'COL-DEMO-2026',
        tier: 'arena_priority',
        allowedFloorIds: ['floor_1'],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      const token = jwt.sign(session, secret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res: any = {};
      const next = vi.fn();

      await authenticateVisitor(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.ticketSession).toBeDefined();
      expect(req.ticketSession.ticketToken).toBe('COL-DEMO-2026');
      expect(req.ticketSession.tier).toBe('arena_priority');
    });
  });

  describe('requireFloorEntitlement', () => {
    it('should allow access if visitor tier is full_access', async () => {
      const req: any = {
        ticketSession: {
          ticketToken: 'T-1',
          tier: 'full_access',
          allowedFloorIds: ['floor_1'],
        },
        params: { floorId: 'floor_underground' },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorEntitlement();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access if floorId is in allowedFloorIds', async () => {
      const req: any = {
        ticketSession: {
          ticketToken: 'T-2',
          tier: 'arena_only',
          allowedFloorIds: ['floor_1'],
        },
        params: { floorId: 'floor_1' },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorEntitlement();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access if floorId is not in allowedFloorIds', async () => {
      const req: any = {
        ticketSession: {
          ticketToken: 'T-2',
          tier: 'arena_only',
          allowedFloorIds: ['floor_1'],
        },
        params: { floorId: 'floor_underground' },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorEntitlement();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });

  describe('requireTicketTier', () => {
    it('should allow matching tier', async () => {
      const req: any = {
        ticketSession: {
          ticketToken: 'T-3',
          tier: 'arena_priority',
        },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireTicketTier('arena_priority', 'full_access');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-matching tier', async () => {
      const req: any = {
        ticketSession: {
          ticketToken: 'T-4',
          tier: 'general',
        },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireTicketTier('full_access');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });
});
