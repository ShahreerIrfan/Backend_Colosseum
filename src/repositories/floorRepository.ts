import { Floor } from '../models/Floor.js';
import { isObjectIdOrHexString } from 'mongoose';
import { Viewpoint } from '../models/Viewpoint.js';
import * as FloorDTO from '@dtos/floorDTO.js';
import { bumpTourManifest } from '@utils/tourManifest.js';

const floorFilter = (id: string) => isObjectIdOrHexString(id)
  ? { $or: [{ floorId: id }, { _id: id }] }
  : { floorId: id };

export default class FloorRepository {
  private toDTO(doc: any, viewpointCount?: number): FloorDTO.Floor {
    return {
      id: doc.floorId || doc._id?.toString(),
      floorId: doc.floorId,
      landmarkCode: doc.landmarkCode || 'colosseum',
      levelIndex: doc.levelIndex ?? 1,
      displayName: doc.displayName,
      shortName: doc.shortName,
      floorNumberLabel: doc.floorNumberLabel,
      semanticLabel: doc.semanticLabel || '',
      calibration: doc.calibration || {
        centerCoordinates: { latitude: 41.89021, longitude: 12.492231 },
        defaultZoom: 18.6,
        mapNorthOffsetDegrees: -20.0,
      },
      mapAsset: doc.mapAsset || {
        assetId: `${doc.floorId}_map`,
        url: '',
      },
      isAccessibleForTier: doc.isAccessibleForTier || ['general', 'arena_priority', 'full_access'],
      isPublished: doc.isPublished ?? true,
      viewpointCount: viewpointCount ?? 0,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }

  async Create(data: FloorDTO.CreateFloor): Promise<FloorDTO.Floor> {
    const created = await Floor.create(data);
    await bumpTourManifest();
    return this.toDTO(created);
  }

  async GetAll(query: FloorDTO.QueryFloor): Promise<{ floors: FloorDTO.Floor[]; total: number }> {
    const filter: any = {};
    if (query.landmark) {
      filter.landmarkCode = query.landmark;
    }
    if (query.search) {
      filter.$or = [
        { displayName: { $regex: query.search, $options: 'i' } },
        { shortName: { $regex: query.search, $options: 'i' } },
        { floorId: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await Floor.countDocuments(filter);
    const docs = await Floor.find(filter).sort({ levelIndex: 1, createdAt: 1 }).lean().exec();

    const counts = await Viewpoint.aggregate([
      { $group: { _id: '$floorId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c._id, c.count));

    const floors = docs.map((doc) => this.toDTO(doc, countMap.get(doc.floorId) || 0));
    return { floors, total };
  }

  async GetByID(id: string): Promise<FloorDTO.Floor | null> {
    const doc = await Floor.findOne(floorFilter(id)).lean().exec();
    if (!doc) return null;
    const vpCount = await Viewpoint.countDocuments({ floorId: doc.floorId });
    return this.toDTO(doc, vpCount);
  }

  async Update(id: string, data: FloorDTO.UpdateFloor): Promise<FloorDTO.Floor | null> {
    const updated = await Floor.findOneAndUpdate(
      floorFilter(id),
      { $set: data },
      { new: true, runValidators: true }
    ).lean().exec();

    if (!updated) return null;
    await bumpTourManifest();
    const vpCount = await Viewpoint.countDocuments({ floorId: updated.floorId });
    return this.toDTO(updated, vpCount);
  }

  async Remove(id: string): Promise<boolean> {
    const res = await Floor.findOneAndDelete(floorFilter(id)).exec();
    if (res) {
      await bumpTourManifest();
      return true;
    }
    return false;
  }


}
