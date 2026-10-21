import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.validation;

export const IdSchema = z.object({
  id: z.string().min(1, { message: Message.id }),
});

export const BaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type BaseQuery = z.infer<typeof BaseQuerySchema>;
export type Id = z.infer<typeof IdSchema>;
