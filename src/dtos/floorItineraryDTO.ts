import { z } from 'zod';

const identifier = z.string().trim().min(1).max(120);
export const floorItineraryParams = z.object({ floorId: identifier });
export const segmentParams = floorItineraryParams.extend({
  segmentId: z.string().regex(/^[a-fA-F0-9]{24}$/),
});

const waypoint = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
const segmentFields = z.object({
  fromId: identifier,
  toId: identifier,
  waypoints: z.array(waypoint).max(250),
  walkingDurationSeconds: z.number().int().min(0).max(86400),
  instruction: z.string().trim().max(1000),
}).strict();

export const createSegment = segmentFields.extend({
  walkingDurationSeconds: segmentFields.shape.walkingDurationSeconds.default(0),
  instruction: segmentFields.shape.instruction.default(''),
});

export const updateSegment = segmentFields.partial().extend({
  isPublished: z.boolean().optional(),
}).strict();

export type SegmentCreate = z.infer<typeof createSegment>;
export type SegmentUpdate = z.infer<typeof updateSegment>;
