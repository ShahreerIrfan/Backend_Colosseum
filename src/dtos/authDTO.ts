import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.validation;

export const RoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'USER',
]);

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(2, Message.name.minimumLength),
  email: z.string().email(Message.email),
  role: RoleSchema.default('USER'),
  assignedFloorIds: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const signUpSchema = z.object({
  name: z.string().min(2, Message.name.minimumLength),
  email: z.string().email(Message.email),
  password: z
    .string()
    .min(8, Message.password.minimumLength)
    .max(32, Message.password.maximumLength)
    .regex(/[A-Z]/, Message.password.containsUpperCase)
    .regex(/[a-z]/, Message.password.containsLowerCase)
    .regex(/[0-9]/, Message.password.containsNumber)
    .regex(/[^A-Za-z0-9]/, Message.password.containsSpecialCharacter),
  role: RoleSchema.optional().default('USER'),
  assignedFloorIds: z.array(z.string()).optional().default([]),
});

export const signInSchema = z.object({
  email: z.string().email(Message.email),
  password: z.string().min(1, 'Password is required'),
});

export const rbacItemSchema = z.object({
  'module name': z.string(),
  Create: z.enum(['true', 'false']),
  Read: z.enum(['true', 'false']),
  Update: z.enum(['true', 'false']),
  Delete: z.enum(['true', 'false']),
});

export const authPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: RoleSchema,
  assignedFloorIds: z.array(z.string()).default([]),
  userRole: z.string().optional(),
  rback: z.array(rbacItemSchema).optional(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: authPayloadSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: signUpSchema.shape.password,
});

export const updateUserRoleSchema = z.object({
  role: RoleSchema,
});

export const updateUserDetailsSchema = z.object({
  name: z.string().min(2, Message.name.minimumLength).optional(),
  email: z.string().email(Message.email).optional(),
  role: RoleSchema.optional(),
  is_active: z.boolean().optional(),
  assignedFloorIds: z.array(z.string()).optional(),
});

export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type AuthPayload = z.infer<typeof authPayloadSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserDetails = z.infer<typeof updateUserDetailsSchema>;
