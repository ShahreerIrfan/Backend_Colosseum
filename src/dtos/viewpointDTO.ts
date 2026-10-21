import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';
import { BaseQuerySchema } from './commonItemDTO.js';

const Message = MessageConstants.validation.viewpoint;

export const ViewpointSchema = z.object({
  id: z.string().min(1, Message.viewpointIdRequired),
  floorId: z.string().min(1, Message.floorIdRequired),
  order: z.number().int().default(1),
  title: z.string().min(1, Message.titleRequired),
  description: z.string().default(''),
  normalizedX: z.number().default(0.5),
  normalizedY: z.number().default(0.5),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  imageAsset: z.string().default(''),
  audioUrl: z.string().default(''),
  audioDuration: z.string().default('3 min'),
  isVisited: z.boolean().default(false),
  triggerRadiusMeters: z.number().default(4.0),
  targetGazeHeadingDegrees: z.number().nullable().default(null),
  isPublished: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateViewpointSchema = ViewpointSchema.omit({
  created_at: true,
  updated_at: true,
});

export const UpdateViewpointSchema = CreateViewpointSchema.partial();

export const QueryViewpointSchema = BaseQuerySchema.extend({
  floorId: z.string().optional(),
  lang: z.string().optional(),
  language: z.string().optional(),
});

export type Viewpoint = z.infer<typeof ViewpointSchema>;
export type CreateViewpoint = z.infer<typeof CreateViewpointSchema>;
export type UpdateViewpoint = z.infer<typeof UpdateViewpointSchema>;
export type QueryViewpoint = z.infer<typeof QueryViewpointSchema>;
