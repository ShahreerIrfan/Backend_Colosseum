import bcrypt from 'bcrypt';
import { EnvConstant } from '@constants/allConstant.js';
import { User } from '../models/User.js';

/**
 * Ensures the SUPER_ADMIN user configured via ADMIN_DEFAULT_EMAIL,
 * ADMIN_DEFAULT_PASSWORD, and ADMIN_DEFAULT_NAME exists and stays in sync on startup.
 */
export const ensureEnvAdminUser = async (): Promise<void> => {
  const email = EnvConstant.ADMIN_DEFAULT_EMAIL.trim().toLowerCase();
  const password = EnvConstant.ADMIN_DEFAULT_PASSWORD;
  const name = EnvConstant.ADMIN_DEFAULT_NAME.trim() || 'Super Administrator';

  if (!email || !password) {
    console.warn('⚠️ ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD is empty; skipping env admin sync.');
    return;
  }

  const existing = await User.findOne({ email }).exec();
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: passwordHash,
      role: 'SUPER_ADMIN',
      assignedFloorIds: [],
      is_active: true,
      is_deleted: false,
      deleted_at: null,
    });
    console.log(`👤 Created env-configured SUPER_ADMIN user: ${email}`);
    return;
  }

  const passwordMatches = await bcrypt.compare(password, existing.password);
  const needsUpdate =
    !passwordMatches ||
    existing.name !== name ||
    existing.role !== 'SUPER_ADMIN' ||
    !existing.is_active ||
    existing.is_deleted;

  if (!needsUpdate) {
    return;
  }

  existing.name = name;
  existing.role = 'SUPER_ADMIN';
  existing.is_active = true;
  existing.is_deleted = false;
  existing.deleted_at = null;
  if (!passwordMatches) {
    existing.password = await bcrypt.hash(password, 10);
  }
  await existing.save();
  console.log(`👤 Synchronized env-configured SUPER_ADMIN user: ${email}`);
};

