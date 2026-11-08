import { z } from 'zod';
import { BaseQuerySchema } from './commonItemDTO.js';

export const FloorCoordinatesSchema = z.object({
  latitude: z.number().default(41.89021),
  longitude: z.number().default(12.492231),
});

export const FloorCalibrationSchema = z.object({
  centerCoordinates: FloorCoordinatesSchema.default({
    latitude: 41.89021,
    longitude: 12.492231,
  }),
  defaultZoom: z.number().default(18.6),
  mapNorthOffsetDegrees: z.number().default(-20.0),
});

export const FloorMapAssetSchema = z.object({
  assetId: z.string().default('floor_map'),
  url: z.string().default(''),
  cloudinaryPublicId: z.string().optional(),
});

export const FloorSchema = z.object({
  id: z.string().optional(),
  floorId: z.string().min(1, 'Floor identifier slug is required'),
  landmarkCode: z.string().default('colosseum'),
  levelIndex: z.number(),
  displayName: z.string().min(1, 'Display name is required'),
  shortName: z.string().min(1, 'Short name is required'),
  floorNumberLabel: z.string().min(1, 'Floor number label is required'),
  semanticLabel: z.string().default(''),
  calibration: FloorCalibrationSchema.default({
    centerCoordinates: { latitude: 41.89021, longitude: 12.492231 },
    defaultZoom: 18.6,
    mapNorthOffsetDegrees: -20.0,
  }),
  mapAsset: FloorMapAssetSchema.default({
    assetId: 'floor_map',
    url: '',
  }),
  isAccessibleForTier: z.array(z.string()).default(['general', 'arena_priority', 'full_access']),
  isPublished: z.boolean().default(true),
  viewpointCount: z.number().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateFloorSchema = FloorSchema.omit({
  id: true,
  viewpointCount: true,
  created_at: true,
  updated_at: true,
});

export const UpdateFloorSchema = CreateFloorSchema.partial();

export const QueryFloorSchema = BaseQuerySchema.extend({
  landmark: z.string().optional(),
  search: z.string().optional(),
});

export type Floor = z.infer<typeof FloorSchema>;
export type CreateFloor = z.infer<typeof CreateFloorSchema>;
export type UpdateFloor = z.infer<typeof UpdateFloorSchema>;
export type QueryFloor = z.infer<typeof QueryFloorSchema>;
