import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';
import { BaseQuerySchema } from './commonItemDTO.js';

const Message = MessageConstants.validation.ticket;

export const ValidateTicketSchema = z.object({
  token: z.string().min(1, Message.tokenRequired),
  deviceId: z.string().optional(),
});

export const TicketSchema = z.object({
  id: z.string().optional(),
  token: z.string().min(1, Message.tokenRequired),
  tier: z
    .enum(['full_access', 'arena_priority', 'arena_only', 'general'])
    .default('full_access'),
  allowedFloorIds: z
    .array(z.string())
    .default(['floor_underground', 'floor_1', 'floor_2', 'floor_3']),
  validFrom: z.coerce.date().default(() => new Date()),
  validUntil: z.coerce.date(),
  maxActivations: z.number().int().min(1).default(1),
  currentActivations: z.number().int().default(0),
  activatedDevices: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateTicketSchema = TicketSchema.omit({
  id: true,
  currentActivations: true,
  activatedDevices: true,
  created_at: true,
  updated_at: true,
});

export const UpdateTicketSchema = CreateTicketSchema.partial();

export const QueryTicketSchema = BaseQuerySchema.extend({
  tier: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  token: z.string().optional(),
});

export const TicketSessionSchema = z.object({
  ticketToken: z.string(),
  tier: z.string(),
  allowedFloorIds: z.array(z.string()),
  deviceId: z.string().nullable().optional(),
  expiresAt: z.string(),
});

export type ValidateTicket = z.infer<typeof ValidateTicketSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type CreateTicket = z.infer<typeof CreateTicketSchema>;
export type UpdateTicket = z.infer<typeof UpdateTicketSchema>;
export type QueryTicket = z.infer<typeof QueryTicketSchema>;
export type TicketSession = z.infer<typeof TicketSessionSchema>;
