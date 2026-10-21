import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';
import { BaseQuerySchema } from './commonItemDTO.js';

const Message = MessageConstants.validation.landmark;

export const LandmarkCenterSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const LandmarkMarkerSchema = z.object({
  colorHex: z.string().default('#C68642'),
  category: z.string().default('monument'),
  iconName: z.string().default('monument'),
  labelOffsetY: z.number().default(0),
});

export const LandmarkSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, Message.codeRequired),
  name: z.string().min(1, Message.nameRequired),
  description: z.string().default(''),
  assetPath: z.string().default(''),
  center: LandmarkCenterSchema,
  widthMeters: z.number().positive(Message.widthMetersRequired),
  heightMeters: z.number().positive(Message.heightMetersRequired),
  rotationDegrees: z.number().default(0.0),
  anchorX: z.number().default(0.5),
  anchorY: z.number().default(0.5),
  zIndex: z.number().int().default(1),
  minZoom: z.number().default(13.0),
  maxZoom: z.number().default(21.0),
  marker: LandmarkMarkerSchema.optional(),
  isPublished: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateLandmarkSchema = LandmarkSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateLandmarkSchema = CreateLandmarkSchema.partial();

export const QueryLandmarkSchema = BaseQuerySchema.extend({
  search: z.string().optional(),
  code: z.string().optional(),
});

export type LandmarkCenter = z.infer<typeof LandmarkCenterSchema>;
export type Landmark = z.infer<typeof LandmarkSchema>;
export type CreateLandmark = z.infer<typeof CreateLandmarkSchema>;
export type UpdateLandmark = z.infer<typeof UpdateLandmarkSchema>;
export type QueryLandmark = z.infer<typeof QueryLandmarkSchema>;
