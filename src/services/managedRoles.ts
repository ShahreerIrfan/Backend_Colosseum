import { ADMIN_MODULE_ACTIONS, getRoleRbac, type CrudAction, type RbacItem, type SystemModuleName } from '@constants/rbacConstants.js';
import { AuthorizationError, BadRequestError, ConflictError, NotFoundError } from '@errors/concreteErrors.js';
import { ManagedRole, SystemRolePermissions } from '../models/ManagedRole.js';
import type { AuthPayload, ManagedRoleInput } from '@dtos/authDTO.js';

const systemRoles = [
  { id: 'SUPER_ADMIN', name: 'Super Admin' },
  { id: 'ADMIN', name: 'Admin' },
  { id: 'MODERATOR', name: 'Moderator' },
  { id: 'USER', name: 'User' },
];
const actions: readonly CrudAction[] = ['Create', 'Read', 'Update', 'Delete'];
const roleId = (id: string) => /^CUSTOM_[a-f0-9]{24}$/.test(id) ? id.slice(7) : null;

export async function resolveAccountRole(role: string): Promise<{ name?: string; permissions: RbacItem[] }> {
  const systemRole = systemRoles.find(({ id }) => id === role);
  if (systemRole) {
    const saved = role === 'ADMIN' ? await SystemRolePermissions.findById(role).lean() : null;
    return { name: systemRole.name, permissions: saved?.permissions ?? getRoleRbac(role) };
  }
  const id = roleId(role);
  if (!id) return { permissions: [] };
  const found = await ManagedRole.findOne({ _id: id, retired: false }).lean();
  return { name: found?.name, permissions: found?.permissions ?? [] };
}

export async function resolvePermissions(role: string): Promise<RbacItem[]> {
  return (await resolveAccountRole(role)).permissions;
}

export function can(actor: AuthPayload, resource: SystemModuleName, action: CrudAction) {
  return (actor.rback ?? []).some((row) => row['module name'] === resource && row[action] === 'true');
}

function assertDelegable(actor: AuthPayload, permissions: RbacItem[]) {
  if (actor.role === 'SUPER_ADMIN') return;
  const exceedsAccess = permissions.some((row) => actions.some((action) =>
    row[action] === 'true' && !can(actor, row['module name'] as SystemModuleName, action)
  ));
  if (exceedsAccess) throw new AuthorizationError('You can only manage permissions you hold.');
}

function validatePermissions(permissions: RbacItem[]) {
  const names = new Set(permissions.map((row) => row['module name']));
  if (names.size !== permissions.length) throw new BadRequestError('Permissions contain duplicate modules.');
  for (const row of permissions) {
    const key = row['module name'];
    if (!Object.hasOwn(ADMIN_MODULE_ACTIONS, key)) throw new BadRequestError('Unknown permission module.');
    const supported: readonly CrudAction[] = ADMIN_MODULE_ACTIONS[key as SystemModuleName];
    if (actions.some((action) => row[action] === 'true' && !supported.includes(action))) {
      throw new BadRequestError('This action is unavailable for the module.');
    }
  }
}

function normalizeInput(input: ManagedRoleInput) {
  const normalizedName = input.name.toLowerCase();
  if (systemRoles.some(({ id, name }) => id.toLowerCase() === normalizedName || name.toLowerCase() === normalizedName)) {
    throw new ConflictError('That name belongs to a built-in role.');
  }
  validatePermissions(input.permissions);
  return { name: input.name, normalizedName, permissions: input.permissions };
}

function toRole(role: { _id: { toString(): string }; name: string; permissions: RbacItem[] }) {
  return { id: `CUSTOM_${role._id}`, name: role.name, permissions: role.permissions, builtIn: false };
}

async function findCustomRole(role: string) {
  const id = roleId(role);
  if (!id) throw new BadRequestError('Built-in roles are managed by the system.');
  const found = await ManagedRole.findOne({ _id: id, retired: false });
  if (!found) throw new NotFoundError('Role not found.');
  return found;
}

export async function listRoles() {
  const [custom, adminPermissions] = await Promise.all([
    ManagedRole.find({ retired: false }).sort({ name: 1 }).lean(),
    resolvePermissions('ADMIN'),
  ]);
  return [
    ...systemRoles.map((role) => ({
      ...role,
      builtIn: true,
      permissions: role.id === 'ADMIN' ? adminPermissions : getRoleRbac(role.id),
    })),
    ...custom.map(toRole),
  ];
}

export async function saveRole(actor: AuthPayload, input: ManagedRoleInput, id?: string) {
  if (id === 'ADMIN') {
    if (actor.role !== 'SUPER_ADMIN') throw new AuthorizationError('Only Super Admin can change Admin permissions.');
    if (input.name !== 'Admin') throw new BadRequestError('The Admin role cannot be renamed.');
    validatePermissions(input.permissions);
    const permissions = getRoleRbac(id).map((row): RbacItem =>
      input.permissions.find((entry) => entry['module name'] === row['module name']) ?? {
        'module name': row['module name'], Create: 'false', Read: 'false', Update: 'false', Delete: 'false',
      });
    await SystemRolePermissions.updateOne({ _id: id }, { $set: { permissions } }, { upsert: true });
    return { id, name: 'Admin', builtIn: true, permissions };
  }
  const values = normalizeInput(input);
  assertDelegable(actor, values.permissions);
  try {
    if (!id) return toRole(await ManagedRole.create(values));
    const current = await findCustomRole(id);
    assertDelegable(actor, current.permissions);
    const changed = await ManagedRole.findOneAndUpdate(
      { _id: current._id, retired: false, revision: current.revision },
      { $set: values, $inc: { revision: 1 } }, { returnDocument: 'after' },
    );
    if (!changed) throw new ConflictError('The role changed. Reload and try again.');
    return toRole(changed);
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) throw new ConflictError('That role name is already in use.');
    throw error;
  }
}

export async function removeRole(actor: AuthPayload, id: string) {
  if (actor.role === id) throw new AuthorizationError('You cannot remove your own role.');
  const current = await findCustomRole(id);
  assertDelegable(actor, current.permissions);
  const result = await ManagedRole.updateOne(
    { _id: current._id, retired: false, revision: current.revision },
    { $set: { retired: true, normalizedName: id }, $inc: { revision: 1 } },
  );
  if (!result.modifiedCount) throw new ConflictError('The role changed. Reload and try again.');
}

export async function assertCanManageAccountRole(actor: AuthPayload, role: string, assigning = false) {
  if (actor.role !== 'SUPER_ADMIN') {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' ||
      (role === 'MODERATOR' && actor.role !== 'ADMIN')) {
      throw new AuthorizationError('This role requires a higher level of access.');
    }
  }
  if (!roleId(role)) return;
  const permissions = assigning ? (await findCustomRole(role)).permissions : await resolvePermissions(role);
  assertDelegable(actor, permissions);
}
