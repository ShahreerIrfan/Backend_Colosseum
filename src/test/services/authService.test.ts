import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@services/authService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EnvConstant } from '@constants/allConstant.js';
import { ManagedRole } from '../../models/ManagedRole.js';

vi.mock('@repositories/authRepository.js');

describe('AuthService - JWT RBAC Integration', () => {
  let authService: AuthService;
  let mockAuthRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    mockAuthRepo = (authService as any).authRepository;
  });

  it('should include userRole and rback in auth response and JWT payload on SignIn', async () => {
    const password = 'SecretPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    mockAuthRepo.FindByEmail = vi.fn().mockResolvedValue({
      _id: 'user_123',
      name: 'Mario Rossi',
      email: 'mario@colosseumtour.it',
      password: hashedPassword,
      role: 'USER',
      assignedFloorIds: [],
      is_active: true,
    });

    const result = await authService.SignIn({
      email: 'mario@colosseumtour.it',
      password: password,
    });

    // Verify response structure
    expect(result.token).toBeDefined();
    expect(result.user.userRole).toBe('user');
    expect(Array.isArray(result.user.rback)).toBe(true);

    // Verify format: { "module name": "Monuments & Landmarks", Create: "false", Read: "true", Update: "false", Delete: "false" }
    const monumentsItem = result.user.rback?.find(
      (m: any) => m['module name'] === 'Monuments & Landmarks'
    );
    expect(monumentsItem).toBeDefined();
    expect(monumentsItem?.Create).toBe('false');
    expect(monumentsItem?.Read).toBe('true');
    expect(monumentsItem?.Update).toBe('false');
    expect(monumentsItem?.Delete).toBe('false');

    // Decode JWT and verify payload contains userRole and rback
    const decoded = jwt.verify(result.token, EnvConstant.JWT_SECRET) as any;
    expect(decoded.userRole).toBe('user');
    expect(decoded.rback).toBeDefined();
    expect(decoded.rback.length).toBeGreaterThan(0);
    expect(decoded.rback[0]['module name']).toBeDefined();
    expect(decoded.rback[0].Create).toBeDefined();
    expect(decoded.rback[0].Read).toBeDefined();
    expect(decoded.rback[0].Update).toBeDefined();
    expect(decoded.rback[0].Delete).toBeDefined();
  });

  it('should grant modification rights in rback for SUPER_ADMIN', async () => {
    const password = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    mockAuthRepo.FindByEmail = vi.fn().mockResolvedValue({
      _id: 'admin_123',
      name: 'Super Administrator',
      email: 'admin@colosseumtour.it',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      assignedFloorIds: [],
      is_active: true,
    });

    const result = await authService.SignIn({
      email: 'admin@colosseumtour.it',
      password: password,
    });

    expect(result.user.userRole).toBe('super_admin');
    expect(result.user.roleName).toBe('Super Admin');
    const landmarks = result.user.rback?.find(
      (m: any) => m['module name'] === 'Monuments & Landmarks'
    );
    expect(landmarks).toEqual({
      'module name': 'Monuments & Landmarks',
      Create: 'true',
      Read: 'true',
      Update: 'true',
      Delete: 'true',
    });
  });

  it('returns the custom role name on sign-in and profile refresh for a dashboard-only user', async () => {
    const role = 'CUSTOM_6af412afe898ad125d2ec681';
    const account = {
      id: 'custom-user',
      name: 'Example user',
      email: 'example@example.com',
      role,
      assignedFloorIds: [],
      is_active: true,
    };
    const password = 'ExamplePassword123!';
    const permissions = [{
      'module name': 'Analytics & Visitor Telemetry',
      Create: 'false', Read: 'true', Update: 'false', Delete: 'false',
    }];
    mockAuthRepo.FindByEmail = vi.fn().mockResolvedValue({
      ...account, _id: account.id, password: await bcrypt.hash(password, 10),
    });
    mockAuthRepo.FindById = vi.fn().mockResolvedValue(account);
    const lookup = vi.spyOn(ManagedRole, 'findOne').mockReturnValue({
      lean: vi.fn()
        .mockResolvedValueOnce({ name: 'Shaeakh', permissions })
        .mockResolvedValueOnce({ name: 'Renamed role', permissions }),
    } as unknown as ReturnType<typeof ManagedRole.findOne>);
    try {
      const session = await authService.SignIn({ email: account.email, password });
      expect(session.user).toMatchObject({ role, roleName: 'Shaeakh', rback: permissions });
      expect(await authService.GetProfile(account.id)).toMatchObject({
        role, roleName: 'Renamed role', rback: permissions,
      });
    } finally {
      lookup.mockRestore();
    }
  });

  it('ignores role and floor assignments supplied through public registration', async () => {
    mockAuthRepo.FindByEmail = vi.fn().mockResolvedValue(null);
    mockAuthRepo.Create = vi.fn().mockImplementation(async (data) => ({ id: 'visitor', ...data }));
    const account = await authService.SignUp({
      ...{ role: 'SUPER_ADMIN', assignedFloorIds: ['floor-1'] },
      name: 'Visitor',
      email: 'visitor@example.com',
      password: 'FixturePassword123!',
    });
    expect(account.user.role).toBe('USER');
    expect(account.user.assignedFloorIds).toEqual([]);
    expect(mockAuthRepo.Create.mock.calls[0][0].password).not.toBe('FixturePassword123!');
  });

  it('does not let an account manager delete a Super Admin account', async () => {
    mockAuthRepo.FindById = vi.fn().mockResolvedValue({ role: 'SUPER_ADMIN' });
    mockAuthRepo.Remove = vi.fn();
    await expect(authService.RemoveUser({
      id: 'staff', role: 'ADMIN', name: 'Staff', email: 'staff@example.com', assignedFloorIds: [],
    }, 'root')).rejects.toThrow('higher level of access');
    expect(mockAuthRepo.Remove).not.toHaveBeenCalled();
  });
});
