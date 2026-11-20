import type { SegmentCreate, SegmentUpdate } from '@dtos/floorItineraryDTO.js';
import { BadRequestError, ConflictError, NotFoundError } from '@errors/concreteErrors.js';
import { Floor } from '../models/Floor.js';
import { ItinerarySegment } from '../models/ItinerarySegment.js';
import { Viewpoint } from '../models/Viewpoint.js';
import { bumpTourManifest } from '@utils/tourManifest.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import type { IItinerarySegment } from '../types/index.js';

async function getFloor(floorId: string) {
  const floor = await Floor.findOne({ floorId }).lean();
  if (!floor) throw new NotFoundError('Floor not found.');
  return floor;
}

async function getViewpoints(floorId: string) {
  return Viewpoint.find({ floorId })
    .select('viewpointId order location translations.en.title isPublished')
    .sort({ order: 1, viewpointId: 1 }).lean();
}

function coordinates(viewpoint: Awaited<ReturnType<typeof getViewpoints>>[number]) {
  const [longitude, latitude] = viewpoint.location?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      (latitude === 0 && longitude === 0)) return null;
  return { latitude, longitude };
}

export async function listFloorItinerary(floorId: string) {
  const [floor, viewpoints, segments] = await Promise.all([
    getFloor(floorId), getViewpoints(floorId),
    ItinerarySegment.find({ floorId }).sort({ createdAt: 1, _id: 1 }).lean(),
  ]);
  return {
    floorPublished: floor.isPublished === true,
    elevationMeters: floor.elevationMeters ?? 0.0,
    autoFloorDetectionEnabled: floor.autoFloorDetectionEnabled !== false,
    viewpoints: viewpoints.map((viewpoint) => ({
      id: viewpoint.viewpointId,
      title: (viewpoint.translations instanceof Map
        ? viewpoint.translations.get('en')
        : (viewpoint.translations as unknown as Record<string, { title: string }>)?.en)?.title
        ?? viewpoint.viewpointId,
      order: viewpoint.order,
      position: coordinates(viewpoint),
      isPublished: viewpoint.isPublished === true,
    })),
    segments,
    portals: floor.portals ?? [],
  };
}

export async function updateFloorPortals(floorId: string, portals: unknown[]) {
  const floor = await Floor.findOneAndUpdate(
    { floorId },
    { $set: { portals } },
    { new: true, runValidators: true }
  ).lean();
  if (!floor) throw new NotFoundError('Floor not found.');
  await bumpTourManifest();
  await clearCachePattern('floors:*');
  await clearCachePattern('tour:*');
  return floor.portals ?? [];
}

async function resolveEndpoints(floorId: string, fromId: string, toId: string, publishing: boolean) {
  if (fromId === toId) throw new BadRequestError('Choose two different Viewpoints.');
  const floor = await getFloor(floorId);
  const endpoints = await Viewpoint.find({ floorId, viewpointId: { $in: [fromId, toId] } })
    .select('viewpointId location isPublished').lean();
  const from = endpoints.find((point) => point.viewpointId === fromId);
  const to = endpoints.find((point) => point.viewpointId === toId);
  if (!from || !to) throw new BadRequestError('Both Viewpoints must belong to the selected Floor.');
  if (publishing && (!floor.isPublished || !from.isPublished || !to.isPublished)) {
    throw new BadRequestError('Publish the Floor and both Viewpoints before publishing the connection.');
  }
  return { from: coordinates(from), to: coordinates(to) };
}

function geometry(
  endpoints: Awaited<ReturnType<typeof resolveEndpoints>>,
  waypoints: SegmentCreate['waypoints'],
) {
  if (!endpoints.from || !endpoints.to) {
    throw new BadRequestError('Set GPS coordinates on both Viewpoints before drawing the connection.');
  }
  const points = [endpoints.from, ...waypoints, endpoints.to].map(({ latitude, longitude }) => ({
    x: latitude, y: longitude,
  }));
  const radians = Math.PI / 180;
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const h = Math.sin((b.x - a.x) * radians / 2) ** 2
      + Math.cos(a.x * radians) * Math.cos(b.x * radians)
      * Math.sin((b.y - a.y) * radians / 2) ** 2;
    distance += 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  if (distance <= 0) throw new BadRequestError('The connection must have a non-zero length.');
  return { points, distanceMeters: Math.round(distance * 10) / 10, coordinateSpace: 'gps' as const };
}

async function syncPublishedChange() {
  await bumpTourManifest();
  await Promise.all([clearCachePattern('sync:floor:*'), clearCachePattern('tours:*')]);
}

function handleDuplicate(error: unknown): never {
  if ((error as { code?: number })?.code === 11000) {
    throw new ConflictError('This direction is already saved for the selected Floor.');
  }
  throw error;
}

export async function createFloorConnection(floorId: string, input: SegmentCreate) {
  const { waypoints, ...fields } = input;
  const endpoints = await resolveEndpoints(floorId, fields.fromId, fields.toId, false);
  await ItinerarySegment.init();
  return ItinerarySegment.create({
    ...fields, floorId, ...geometry(endpoints, waypoints), isPublished: false,
  }).catch(handleDuplicate);
}

export async function updateFloorConnection(floorId: string, segmentId: string, input: SegmentUpdate) {
  const current = await ItinerarySegment.findOne({ _id: segmentId, floorId }).lean();
  if (!current) throw new NotFoundError('Connection not found.');
  const { waypoints, ...fields } = input;
  const fromId = fields.fromId ?? current.fromId;
  const toId = fields.toId ?? current.toId;
  const published = fields.isPublished ?? current.isPublished;
  const endpointsChanged = fromId !== current.fromId || toId !== current.toId;
  if (endpointsChanged && waypoints === undefined) {
    throw new BadRequestError('Provide the updated path when changing the Viewpoints.');
  }
  const changes: Partial<IItinerarySegment> = fields;
  if (waypoints !== undefined || endpointsChanged || fields.isPublished === true) {
    const endpoints = await resolveEndpoints(floorId, fromId, toId, published);
    if (waypoints !== undefined) Object.assign(changes, geometry(endpoints, waypoints));
  }
  const updated = await ItinerarySegment.findOneAndUpdate(
    { _id: segmentId, floorId, updatedAt: current.updatedAt },
    { $set: changes }, { new: true, runValidators: true },
  ).lean().exec().catch(handleDuplicate);
  if (!updated) throw new ConflictError('This connection changed. Reload the Floor and try again.');
  if (current.isPublished || updated.isPublished) await syncPublishedChange();
  return updated;
}

export async function deleteFloorConnection(floorId: string, segmentId: string) {
  const removed = await ItinerarySegment.findOneAndDelete({ _id: segmentId, floorId });
  if (!removed) throw new NotFoundError('Connection not found.');
  if (removed.isPublished) await syncPublishedChange();
}
