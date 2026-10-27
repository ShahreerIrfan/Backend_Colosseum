import { Landmark } from '../models/Landmark.js';
import * as LandmarkDTO from '@dtos/landmarkDTO.js';

export default class LandmarkRepository {
  async Create(data: LandmarkDTO.CreateLandmark): Promise<LandmarkDTO.Landmark> {
    const doc = new Landmark({
      code: data.code,
      name: data.name,
      description: data.description || '',
      assetPath: data.assetPath || '',
      cloudinaryPublicId: data.cloudinaryPublicId || '',
      thumbnailUrl: data.thumbnailUrl || '',
      thumbnailPublicId: data.thumbnailPublicId || '',
      location: {
        type: 'Point',
        coordinates: [data.center.longitude, data.center.latitude],
      },
      dimensions: {
        widthMeters: data.widthMeters,
        heightMeters: data.heightMeters,
      },
      calibration: {
        rotationDegrees: data.rotationDegrees || 0.0,
        anchorX: data.anchorX ?? 0.5,
        anchorY: data.anchorY ?? 0.5,
      },
      display: {
        zIndex: data.zIndex || 1,
        minZoom: data.minZoom || 13.0,
        maxZoom: data.maxZoom || 21.0,
      },
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    });

    const saved = await doc.save();
    return this.mapToDTO(saved);
  }

  async GetAll(queryData: LandmarkDTO.QueryLandmark): Promise<{
    landmarks: LandmarkDTO.Landmark[];
    total: number;
  }> {
    const page = queryData.page || 1;
    const limit = queryData.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isPublished: true };
    if (queryData.search) {
      filter.$or = [
        { name: { $regex: queryData.search, $options: 'i' } },
        { code: { $regex: queryData.search, $options: 'i' } },
      ];
    }
    if (queryData.code) {
      filter.code = queryData.code;
    }

    const sortField = queryData.sortBy || 'createdAt';
    const sortDirection = queryData.sortOrder === 'asc' ? 1 : -1;

    const [landmarks, total] = await Promise.all([
      Landmark.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Landmark.countDocuments(filter).exec(),
    ]);

    return {
      landmarks: landmarks.map((lm) => this.mapToDTO(lm)),
      total,
    };
  }

  private buildIdOrCodeFilter(idOrCode: string): Record<string, any> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
    return isObjectId ? { $or: [{ _id: idOrCode }, { code: idOrCode }] } : { code: idOrCode };
  }

  async GetByID(idOrCode: string): Promise<LandmarkDTO.Landmark | null> {
    const doc = await Landmark.findOne(this.buildIdOrCodeFilter(idOrCode))
      .lean()
      .exec();

    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async GetByCode(code: string): Promise<LandmarkDTO.Landmark | null> {
    const doc = await Landmark.findOne({ code, isPublished: true }).lean().exec();
    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async Update(
    idOrCode: string,
    data: LandmarkDTO.UpdateLandmark
  ): Promise<LandmarkDTO.Landmark | null> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assetPath !== undefined) updateData.assetPath = data.assetPath;
    if (data.cloudinaryPublicId !== undefined) updateData.cloudinaryPublicId = data.cloudinaryPublicId;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.thumbnailPublicId !== undefined) updateData.thumbnailPublicId = data.thumbnailPublicId;
    if (data.center !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [data.center.longitude, data.center.latitude],
      };
    }
    if (data.widthMeters !== undefined) updateData['dimensions.widthMeters'] = data.widthMeters;
    if (data.heightMeters !== undefined) updateData['dimensions.heightMeters'] = data.heightMeters;
    if (data.rotationDegrees !== undefined)
      updateData['calibration.rotationDegrees'] = data.rotationDegrees;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    const doc = await Landmark.findOneAndUpdate(
      this.buildIdOrCodeFilter(idOrCode),
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async Remove(idOrCode: string): Promise<boolean> {
    const res = await Landmark.deleteOne(this.buildIdOrCodeFilter(idOrCode)).exec();

    return (res.deletedCount ?? 0) > 0;
  }

  async FindActiveOverlays(): Promise<any[]> {
    const raw = await Landmark.find({ isPublished: true }).sort({ 'display.zIndex': 1 }).lean().exec();

    return raw.map((lm: any) => ({
      id: lm.code,
      name: lm.name,
      description: lm.description || '',
      assetPath: lm.assetPath,
      cloudinaryPublicId: lm.cloudinaryPublicId || '',
      thumbnailUrl: lm.thumbnailUrl || '',
      thumbnailPublicId: lm.thumbnailPublicId || '',
      center: {
        latitude: lm.location?.coordinates?.[1] ?? 0.0,
        longitude: lm.location?.coordinates?.[0] ?? 0.0,
      },
      widthMeters: lm.dimensions?.widthMeters ?? 50.0,
      heightMeters: lm.dimensions?.heightMeters ?? 50.0,
      rotationDegrees: lm.calibration?.rotationDegrees ?? 0.0,
      anchorX: lm.calibration?.anchorX ?? 0.5,
      anchorY: lm.calibration?.anchorY ?? 0.5,
      zIndex: lm.display?.zIndex ?? 1,
      minZoom: lm.display?.minZoom ?? 13.0,
      maxZoom: lm.display?.maxZoom ?? 21.0,
      marker: lm.marker || {
        colorHex: '#C68642',
        category: 'monument',
        iconName: 'monument',
        labelOffsetY: 0,
      },
    }));
  }

  private mapToDTO(lm: any): LandmarkDTO.Landmark {
    return {
      id: lm.code || lm._id?.toString(),
      code: lm.code,
      name: lm.name,
      description: lm.description || '',
      assetPath: lm.assetPath || '',
      cloudinaryPublicId: lm.cloudinaryPublicId || '',
      thumbnailUrl: lm.thumbnailUrl || '',
      thumbnailPublicId: lm.thumbnailPublicId || '',
      center: {
        latitude: lm.location?.coordinates?.[1] ?? 0.0,
        longitude: lm.location?.coordinates?.[0] ?? 0.0,
      },
      widthMeters: lm.dimensions?.widthMeters ?? 50.0,
      heightMeters: lm.dimensions?.heightMeters ?? 50.0,
      rotationDegrees: lm.calibration?.rotationDegrees ?? 0.0,
      anchorX: lm.calibration?.anchorX ?? 0.5,
      anchorY: lm.calibration?.anchorY ?? 0.5,
      zIndex: lm.display?.zIndex ?? 1,
      minZoom: lm.display?.minZoom ?? 13.0,
      maxZoom: lm.display?.maxZoom ?? 21.0,
      marker: lm.marker,
      isPublished: lm.isPublished ?? true,
      created_at: lm.createdAt,
      updated_at: lm.updatedAt,
    };
  }
}
