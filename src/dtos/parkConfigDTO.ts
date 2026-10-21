import { z } from 'zod';

export const ParkConfigSchema = z.object({
  configKey: z.string().default('archaeological_park_colosseum'),
  centerCoordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  boundaryRadiusMeters: z.number().positive(),
  proximityThresholds: z.record(z.string(), z.number()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const UpdateParkConfigSchema = ParkConfigSchema.omit({
  created_at: true,
  updated_at: true,
}).partial();

export type ParkConfig = z.infer<typeof ParkConfigSchema>;
export type UpdateParkConfig = z.infer<typeof UpdateParkConfigSchema>;
