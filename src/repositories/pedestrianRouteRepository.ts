import { PedestrianRoute } from '../models/PedestrianRoute.js';
import * as PedestrianRouteDTO from '@dtos/pedestrianRouteDTO.js';

export default class PedestrianRouteRepository {
  async Create(
    data: PedestrianRouteDTO.CreatePedestrianRoute
  ): Promise<PedestrianRouteDTO.PedestrianRoute> {
    const doc = new PedestrianRoute(data);
    const saved = await doc.save();
    return this.mapToDTO(saved);
  }

  async GetAll(queryData: PedestrianRouteDTO.QueryPedestrianRoute): Promise<{
    routes: PedestrianRouteDTO.PedestrianRoute[];
    total: number;
  }> {
    const page = queryData.page || 1;
    const limit = queryData.limit || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isPublished: true };
    if (queryData.fromLandmarkCode) {
      filter.fromLandmarkCode = queryData.fromLandmarkCode;
    }
    if (queryData.toLandmarkCode) {
      filter.toLandmarkCode = queryData.toLandmarkCode;
    }

    const [routes, total] = await Promise.all([
      PedestrianRoute.find(filter).skip(skip).limit(limit).lean().exec(),
      PedestrianRoute.countDocuments(filter).exec(),
    ]);

    return {
      routes: routes.map((r) => this.mapToDTO(r)),
      total,
    };
  }

  async GetByID(idOrRouteId: string): Promise<PedestrianRouteDTO.PedestrianRoute | null> {
    const doc = await PedestrianRoute.findOne({
      $or: [
        { _id: idOrRouteId.match(/^[0-9a-fA-F]{24}$/) ? idOrRouteId : null },
        { routeId: idOrRouteId },
      ],
    })
      .lean()
      .exec();

    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async FindBetween(
    fromLandmarkCode: string,
    toLandmarkCode: string
  ): Promise<PedestrianRouteDTO.PedestrianRoute | null> {
    const doc = await PedestrianRoute.findOne({
      $or: [
        { fromLandmarkCode, toLandmarkCode },
        { fromLandmarkCode: toLandmarkCode, toLandmarkCode: fromLandmarkCode },
      ],
      isPublished: true,
    })
      .lean()
      .exec();

    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async Update(
    idOrRouteId: string,
    data: PedestrianRouteDTO.UpdatePedestrianRoute
  ): Promise<PedestrianRouteDTO.PedestrianRoute | null> {
    const updated = await PedestrianRoute.findOneAndUpdate(
      {
        $or: [
          { _id: idOrRouteId.match(/^[0-9a-fA-F]{24}$/) ? idOrRouteId : null },
          { routeId: idOrRouteId },
        ],
      },
      { $set: data },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return this.mapToDTO(updated);
  }

  async Remove(idOrRouteId: string): Promise<boolean> {
    const res = await PedestrianRoute.deleteOne({
      $or: [
        { _id: idOrRouteId.match(/^[0-9a-fA-F]{24}$/) ? idOrRouteId : null },
        { routeId: idOrRouteId },
      ],
    }).exec();

    return res.deletedCount > 0;
  }

  private mapToDTO(doc: any): PedestrianRouteDTO.PedestrianRoute {
    return {
      id: doc._id?.toString(),
      routeId: doc.routeId,
      name: doc.name,
      fromLandmarkCode: doc.fromLandmarkCode,
      toLandmarkCode: doc.toLandmarkCode,
      distanceMeters: doc.distanceMeters,
      estimatedWalkMinutes: doc.estimatedWalkMinutes,
      waypoints: (doc.waypoints || []).map((w: any) => ({
        latitude: w.latitude,
        longitude: w.longitude,
      })),
      isAccessibleWheelchair: doc.isAccessibleWheelchair,
      isPublished: doc.isPublished,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }
}
