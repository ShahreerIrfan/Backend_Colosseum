import { describe, it, expect, vi } from 'vitest';
import {
  adminOnly,
  hasRole,
  requireStaff,
  requireFloorAssignment,
} from '@middlewares/authorizeRoles.js';
import * as Error from '@errors/concreteErrors.js';

describe('authorizeRoles Middleware', () => {
  describe('adminOnly', () => {
    it('should reject unauthenticated request', async () => {
      const req: any = {};
      const res: any = {};
      const next = vi.fn();

      await adminOnly(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthenticationError));
    });

    it('should allow ADMIN role', async () => {
      const req: any = { user: { role: 'ADMIN' } };
      const res: any = {};
      const next = vi.fn();

      await adminOnly(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow SUPER_ADMIN role', async () => {
      const req: any = { user: { role: 'SUPER_ADMIN' } };
      const res: any = {};
      const next = vi.fn();

      await adminOnly(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny MODERATOR role', async () => {
      const req: any = { user: { role: 'MODERATOR' } };
      const res: any = {};
      const next = vi.fn();

      await adminOnly(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });

  describe('hasRole', () => {
    it('should allow listed role', async () => {
      const req: any = { user: { role: 'MODERATOR' } };
      const res: any = {};
      const next = vi.fn();

      const middleware = hasRole('MODERATOR');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny unlisted role', async () => {
      const req: any = { user: { role: 'USER' } };
      const res: any = {};
      const next = vi.fn();

      const middleware = hasRole('MODERATOR');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });

  describe('requireStaff', () => {
    it('should allow staff roles (MODERATOR, ADMIN, SUPER_ADMIN)', async () => {
      const req: any = { user: { role: 'MODERATOR' } };
      const res: any = {};
      const next = vi.fn();

      await requireStaff(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject normal USER role', async () => {
      const req: any = { user: { role: 'USER' } };
      const res: any = {};
      const next = vi.fn();

      await requireStaff(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });

  describe('requireFloorAssignment (RuBAC)', () => {
    it('should allow SUPER_ADMIN to modify any floor', async () => {
      const req: any = {
        user: { role: 'SUPER_ADMIN', assignedFloorIds: [] },
        body: { floorId: 'floor_underground' },
        method: 'POST',
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorAssignment();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow MODERATOR to modify assigned floor', async () => {
      const req: any = {
        user: { role: 'MODERATOR', assignedFloorIds: ['floor_underground', 'floor_1'] },
        params: { id: 'floor_1' },
        method: 'PATCH',
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorAssignment();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny MODERATOR from modifying unassigned floor', async () => {
      const req: any = {
        user: { role: 'MODERATOR', assignedFloorIds: ['floor_underground', 'floor_1'] },
        body: { floorId: 'floor_2' },
        method: 'POST',
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireFloorAssignment();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error.AuthorizationError));
    });
  });
});
