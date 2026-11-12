import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { EnvConstant } from '@constants/allConstant.js';
import { ensureEnvAdminUser } from '@services/bootstrapAdmin.js';
import { User } from '../../models/User.js';

describe('ensureEnvAdminUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    EnvConstant.ADMIN_DEFAULT_NAME = 'Colosseum Admin';
    EnvConstant.ADMIN_DEFAULT_EMAIL = 'admin@colosseumtour.it';
    EnvConstant.ADMIN_DEFAULT_PASSWORD = 'StrongAdminPassword2026!';
  });

  it('creates a SUPER_ADMIN user when missing', async () => {
    const findOneMock = vi.spyOn(User, 'findOne').mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as any);
    const createMock = vi.spyOn(User, 'create').mockResolvedValue({} as any);

    await ensureEnvAdminUser();

    expect(findOneMock).toHaveBeenCalledWith({ email: 'admin@colosseumtour.it' });
    expect(createMock).toHaveBeenCalledTimes(1);
    const createdArg = createMock.mock.calls[0][0] as any;
    expect(createdArg.email).toBe('admin@colosseumtour.it');
    expect(createdArg.name).toBe('Colosseum Admin');
    expect(createdArg.role).toBe('SUPER_ADMIN');
    expect(createdArg.is_active).toBe(true);
    expect(createdArg.is_deleted).toBe(false);
    expect(await bcrypt.compare('StrongAdminPassword2026!', createdArg.password)).toBe(true);
  });

  it('updates password, role, and active state when existing user drifts from env', async () => {
    const oldHash = await bcrypt.hash('OldPassword123!', 10);
    const saveMock = vi.fn().mockResolvedValue(undefined);
    const existingDoc: any = {
      name: 'Old Name',
      email: 'admin@colosseumtour.it',
      password: oldHash,
      role: 'USER',
      is_active: false,
      is_deleted: true,
      deleted_at: new Date(),
      save: saveMock,
    };

    vi.spyOn(User, 'findOne').mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingDoc),
    } as any);

    await ensureEnvAdminUser();

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(existingDoc.name).toBe('Colosseum Admin');
    expect(existingDoc.role).toBe('SUPER_ADMIN');
    expect(existingDoc.is_active).toBe(true);
    expect(existingDoc.is_deleted).toBe(false);
    expect(existingDoc.deleted_at).toBeNull();
    expect(await bcrypt.compare('StrongAdminPassword2026!', existingDoc.password)).toBe(true);
  });

  it('does not save when existing SUPER_ADMIN already matches env config', async () => {
    const matchingHash = await bcrypt.hash('StrongAdminPassword2026!', 10);
    const saveMock = vi.fn();
    const existingDoc: any = {
      name: 'Colosseum Admin',
      email: 'admin@colosseumtour.it',
      password: matchingHash,
      role: 'SUPER_ADMIN',
      is_active: true,
      is_deleted: false,
      save: saveMock,
    };

    vi.spyOn(User, 'findOne').mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingDoc),
    } as any);

    await ensureEnvAdminUser();

    expect(saveMock).not.toHaveBeenCalled();
  });

  it('skips cleanly when email or password is empty', async () => {
    EnvConstant.ADMIN_DEFAULT_EMAIL = '   ';
    const findOneMock = vi.spyOn(User, 'findOne');

    await ensureEnvAdminUser();

    expect(findOneMock).not.toHaveBeenCalled();
  });
});

