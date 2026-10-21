import { z } from 'zod';
import { BaseQuerySchema } from './commonItemDTO.js';

export const WaypointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const PedestrianRouteSchema = z.object({
  id: z.string().optional(),
  routeId: z.string().min(1, 'Route ID is required'),
  name: z.string().min(1, 'Route name is required'),
  fromLandmarkCode: z.string().min(1, 'From landmark code is required'),
  toLandmarkCode: z.string().min(1, 'To landmark code is required'),
  distanceMeters: z.number().positive('Distance must be positive'),
  estimatedWalkMinutes: z.number().positive('Estimated minutes must be positive'),
  waypoints: z.array(WaypointSchema).min(2, 'Route requires at least 2 waypoints'),
  isAccessibleWheelchair: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreatePedestrianRouteSchema = PedestrianRouteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdatePedestrianRouteSchema = CreatePedestrianRouteSchema.partial();

export const QueryPedestrianRouteSchema = BaseQuerySchema.extend({
  fromLandmarkCode: z.string().optional(),
  toLandmarkCode: z.string().optional(),
});

export type Waypoint = z.infer<typeof WaypointSchema>;
export type PedestrianRoute = z.infer<typeof PedestrianRouteSchema>;
export type CreatePedestrianRoute = z.infer<typeof CreatePedestrianRouteSchema>;
export type UpdatePedestrianRoute = z.infer<typeof UpdatePedestrianRouteSchema>;
export type QueryPedestrianRoute = z.infer<typeof QueryPedestrianRouteSchema>;
