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
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  imageAsset: z.string().default(''),
  narrationLanguage: z.string().optional(),
  isVisited: z.boolean().default(false),
  triggerRadiusMeters: z.number().positive().default(4.0),
  targetGazeHeadingDegrees: z.number().min(0).max(360).nullable().default(null),
  isPublished: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateViewpointSchema = ViewpointSchema.omit({
  narrationLanguage: true,
  created_at: true,
  updated_at: true,
});

const fields = CreateViewpointSchema.shape;
export const UpdateViewpointSchema = z.object({
  ...fields,
  order: fields.order.removeDefault(),
  description: fields.description.removeDefault(),
  normalizedX: fields.normalizedX.removeDefault(),
  normalizedY: fields.normalizedY.removeDefault(),
  latitude: fields.latitude.removeDefault(),
  longitude: fields.longitude.removeDefault(),
  imageAsset: fields.imageAsset.removeDefault(),
  isVisited: fields.isVisited.removeDefault(),
  triggerRadiusMeters: fields.triggerRadiusMeters.removeDefault(),
  targetGazeHeadingDegrees: fields.targetGazeHeadingDegrees.removeDefault(),
  isPublished: fields.isPublished.removeDefault(),
}).partial().refine(
  ({ latitude, longitude }) =>
    (latitude === undefined && longitude === undefined) ||
    (typeof latitude === 'number' && typeof longitude === 'number') ||
    (latitude === null && longitude === null),
  'Supply both Latitude and Longitude, or clear both.'
);

export const QueryViewpointSchema = BaseQuerySchema.extend({
  floorId: z.string().optional(),
  lang: z.string().optional(),
  language: z.string().optional(),
});

export type Viewpoint = z.infer<typeof ViewpointSchema>;
export type CreateViewpoint = z.infer<typeof CreateViewpointSchema>;
export type UpdateViewpoint = z.infer<typeof UpdateViewpointSchema>;
export type QueryViewpoint = z.infer<typeof QueryViewpointSchema>;
