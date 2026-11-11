import { Router } from 'express';
import type { PipelineStage } from 'mongoose';
import { z } from 'zod';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
import { Validator } from '@middlewares/requestValidator.js';
import ResponseHandler from '@utils/responseHandler.js';
import { TourAnalyticsEvent } from '../models/TourAnalyticsEvent.js';

const retention = 90 * 24 * 60 * 60 * 1000;
const id = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
const anonymousId = z.string().regex(/^[a-f0-9]{32}$/);
const event = z.object({
  eventId: anonymousId,
  sessionId: anonymousId,
  occurredAt: z.iso.datetime(),
  type: z.enum([
    'tour_started', 'tour_completed', 'tour_stopped',
    'landmark_entered', 'landmark_skipped', 'viewpoint_visited', 'viewpoint_skipped',
    'narration_started', 'narration_completed',
  ]),
  tourKind: z.enum(['outdoor', 'floor']),
  landmarkId: id.optional(),
  floorId: id.optional(),
  viewpointId: id.optional(),
  language: id,
});

const router = Router();
router.post('/events', Validator.body(z.object({
  installationId: anonymousId,
  events: z.array(event).min(1).max(50),
})), async (req, res) => {
  const now = Date.now();
  const { installationId, events } = req.validatedBody as {
    installationId: string; events: z.infer<typeof event>[];
  };
  const rows = events.flatMap((row) => {
    const timestamp = Date.parse(row.occurredAt);
    if (timestamp < now - retention || timestamp > now + 5 * 60 * 1000) return [];
    const { eventId, ...eventData } = row;
    return [{
      updateOne: {
        filter: { _id: eventId },
        update: { $setOnInsert: {
          ...eventData,
          installationId,
          occurredAt: new Date(timestamp),
          expiresAt: new Date(timestamp + retention),
        } },
        upsert: true,
      },
    }];
  });
  if (rows.length > 0) await TourAnalyticsEvent.bulkWrite(rows, { ordered: false });
  ResponseHandler.send(res, 200, { message: 'Analytics batch processed.' });
});

router.get('/summary', authenticateToken, managedRolePermission('Analytics & Visitor Telemetry', 'Read', authorizeRole.adminOnly),
  Validator.query(z.object({
    days: z.coerce.number().int().min(1).max(90).default(30),
    landmarkId: id.optional(),
    floorId: id.optional(),
    language: id.optional(),
    tourKind: z.enum(['outdoor', 'floor']).optional(),
  })), async (req, res) => {
    const { days, ...filters } = req.validatedQuery;
    const match = {
      ...filters,
      occurredAt: { $gte: new Date(Date.now() - days * 86400000) },
    };
    const pipeline: PipelineStage[] = [
      { $match: match },
      { $facet: {
        totals: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
        landmarks: [
          { $match: { type: 'landmark_entered', landmarkId: { $exists: true } } },
          { $group: { _id: '$landmarkId', count: { $sum: 1 } } },
          { $sort: { count: -1 } }, { $limit: 20 },
        ],
        skipped: [
          { $match: { type: 'viewpoint_skipped', viewpointId: { $exists: true } } },
          { $group: { _id: '$viewpointId', count: { $sum: 1 } } },
          { $sort: { count: -1 } }, { $limit: 20 },
        ],
        lastStops: [
          { $set: { hasViewpoint: { $ne: [{ $ifNull: ['$viewpointId', null] }, null] } } },
          { $group: {
            _id: '$sessionId',
            stopped: { $max: { $eq: ['$type', 'tour_stopped'] } },
            completed: { $max: { $eq: ['$type', 'tour_completed'] } },
            stop: { $top: {
              sortBy: { hasViewpoint: -1, occurredAt: -1, _id: -1 },
              output: '$viewpointId',
            } },
          } },
          { $match: { stopped: true, completed: false, stop: { $ne: null } } },
          { $group: { _id: '$stop', count: { $sum: 1 } } },
          { $sort: { count: -1 } }, { $limit: 20 },
        ],
        completedDurations: [
          { $match: { type: { $in: ['tour_started', 'tour_completed'] } } },
          { $group: {
            _id: '$sessionId',
            start: { $min: { $cond: [{ $eq: ['$type', 'tour_started'] }, '$occurredAt', null] } },
            end: { $max: { $cond: [{ $eq: ['$type', 'tour_completed'] }, '$occurredAt', null] } },
          } },
          { $match: { start: { $ne: null }, end: { $ne: null }, $expr: { $gte: ['$end', '$start'] } } },
          { $group: { _id: null, averageMs: { $avg: { $subtract: ['$end', '$start'] } } } },
        ],
      } },
    ];
    const [summary] = await TourAnalyticsEvent.aggregate(pipeline).exec();
    ResponseHandler.send(res, 200, { data: summary });
  });

export default router;
