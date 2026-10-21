import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@services/authService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EnvConstant } from '@constants/allConstant.js';

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
});
