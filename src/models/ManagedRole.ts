import { Schema, model, type Model } from 'mongoose';
import type { RbacItem } from '@constants/rbacConstants.js';

interface RoleRecord {
  name: string;
  normalizedName: string;
  permissions: RbacItem[];
  retired: boolean;
  revision: number;
}

const permissionSchema = new Schema<RbacItem>({
  'module name': { type: String, required: true },
  Create: { type: String, enum: ['true', 'false'], required: true },
  Read: { type: String, enum: ['true', 'false'], required: true },
  Update: { type: String, enum: ['true', 'false'], required: true },
  Delete: { type: String, enum: ['true', 'false'], required: true },
}, { _id: false });

export const ManagedRole: Model<RoleRecord> = model('ManagedRole', new Schema<RoleRecord>({
  name: { type: String, required: true },
  normalizedName: { type: String, required: true, unique: true },
  permissions: { type: [permissionSchema], required: true },
  retired: { type: Boolean, default: false },
  revision: { type: Number, default: 0 },
}));

export const SystemRolePermissions = model('SystemRolePermissions', new Schema({
  _id: { type: String, required: true },
  permissions: { type: [permissionSchema], required: true },
}));
