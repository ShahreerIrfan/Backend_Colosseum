import { Viewpoint } from '../models/Viewpoint.js';
import * as ViewpointDTO from '@dtos/viewpointDTO.js';
import crypto from 'crypto';
import { TourSyncManifest } from '../models/TourSyncManifest.js';

export default class ViewpointRepository {
  private async touchManifest(): Promise<void> {
    try {
      const current = await TourSyncManifest.findOne({ isCurrent: true });
      if (current) {
        current.contentHash = crypto.randomBytes(16).toString('hex');
        current.updatedAt = new Date();
        await current.save();
      }
    } catch (_) {}
  }
  async Create(data: ViewpointDTO.CreateViewpoint): Promise<ViewpointDTO.Viewpoint> {
    const doc = new Viewpoint({
      viewpointId: data.id,
      floorId: data.floorId,
      order: data.order || 1,
      canvasCoordinates: {
        normalizedX: data.normalizedX,
        normalizedY: data.normalizedY,
      },
      location: {
        type: 'Point',
        coordinates: [data.longitude || 0.0, data.latitude || 0.0],
      },
      navigation: {
        triggerRadiusMeters: data.triggerRadiusMeters || 4.0,
        targetGazeHeadingDegrees: data.targetGazeHeadingDegrees || null,
      },
      translations: {
        en: {
          title: data.title,
          description: data.description || '',
          audioUrl: data.audioUrl || '',
          audioDuration: data.audioDuration || '3 min',
        },
      },
      image: {
        url: data.imageAsset || '',
        assetName: data.imageAsset || '',
      },
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    });

    const saved = await doc.save();
    await this.touchManifest();
    return this.resolveLanguage(saved, 'en');
  }

  async GetAll(queryData: ViewpointDTO.QueryViewpoint): Promise<{
    viewpoints: ViewpointDTO.Viewpoint[];
    total: number;
  }> {
    const page = queryData.page || 1;
    const limit = queryData.limit || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isPublished: true };
    if (queryData.floorId) {
      filter.floorId = queryData.floorId;
    }

    const lang = queryData.lang || queryData.language || 'en';

    const [viewpoints, total] = await Promise.all([
      Viewpoint.find(filter).sort({ order: 1 }).skip(skip).limit(limit).lean().exec(),
      Viewpoint.countDocuments(filter).exec(),
    ]);

    return {
      viewpoints: viewpoints.map((vp) => this.resolveLanguage(vp, lang)),
      total,
    };
  }

  async GetByID(viewpointId: string, languageCode: string = 'en'): Promise<ViewpointDTO.Viewpoint | null> {
    const vp = await Viewpoint.findOne({
      $or: [{ viewpointId }, { _id: viewpointId.match(/^[0-9a-fA-F]{24}$/) ? viewpointId : null }],
      isPublished: true,
    })
      .lean()
      .exec();

    if (!vp) return null;
    return this.resolveLanguage(vp, languageCode);
  }

  async Update(
    viewpointId: string,
    data: ViewpointDTO.UpdateViewpoint
  ): Promise<ViewpointDTO.Viewpoint | null> {
    const updateQuery: Record<string, any> = {};
    if (data.order !== undefined) updateQuery.order = data.order;
    if (data.normalizedX !== undefined)
      updateQuery['canvasCoordinates.normalizedX'] = data.normalizedX;
    if (data.normalizedY !== undefined)
      updateQuery['canvasCoordinates.normalizedY'] = data.normalizedY;
    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateQuery.location = {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      };
    }
    if (data.imageAsset !== undefined) updateQuery['image.url'] = data.imageAsset;
    if (data.triggerRadiusMeters !== undefined)
      updateQuery['navigation.triggerRadiusMeters'] = data.triggerRadiusMeters;
    if (data.targetGazeHeadingDegrees !== undefined)
      updateQuery['navigation.targetGazeHeadingDegrees'] = data.targetGazeHeadingDegrees;
    if (data.isPublished !== undefined) updateQuery.isPublished = data.isPublished;

    if (data.title !== undefined || data.description !== undefined || data.audioUrl !== undefined) {
      if (data.title !== undefined) updateQuery['translations.en.title'] = data.title;
      if (data.description !== undefined)
        updateQuery['translations.en.description'] = data.description;
      if (data.audioUrl !== undefined) updateQuery['translations.en.audioUrl'] = data.audioUrl;
      if (data.audioDuration !== undefined)
        updateQuery['translations.en.audioDuration'] = data.audioDuration;
    }

    const updated = await Viewpoint.findOneAndUpdate(
      {
        $or: [
          { viewpointId },
          { _id: viewpointId.match(/^[0-9a-fA-F]{24}$/) ? viewpointId : null },
        ],
      },
      { $set: updateQuery },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    await this.touchManifest();
    return this.resolveLanguage(updated, 'en');
  }

  async Remove(viewpointId: string): Promise<boolean> {
    const res = await Viewpoint.updateOne(
      {
        $or: [
          { viewpointId },
          { _id: viewpointId.match(/^[0-9a-fA-F]{24}$/) ? viewpointId : null },
        ],
      },
      { $set: { isPublished: false } }
    ).exec();

    if (res.modifiedCount > 0) {
      await this.touchManifest();
      return true;
    }
    return false;
  }

  async FindByFloor(floorId: string, languageCode: string = 'en'): Promise<ViewpointDTO.Viewpoint[]> {
    const raw = await Viewpoint.find({ floorId, isPublished: true }).sort({ order: 1 }).lean().exec();
    return raw.map((vp) => this.resolveLanguage(vp, languageCode));
  }

  private resolveLanguage(vp: any, languageCode: string = 'en'): ViewpointDTO.Viewpoint {
    const translations = vp.translations || {};
    let localized: any;
    if (translations instanceof Map) {
      localized =
        translations.get(languageCode) ||
        translations.get('en') ||
        translations.values().next().value;
    } else if (typeof translations === 'object') {
      localized = translations[languageCode] || translations.en || Object.values(translations)[0];
    }

    const {
      title = '',
      description = '',
      audioUrl = '',
      audioDuration = '3 min',
    } = localized || {};

    return {
      id: vp.viewpointId || vp._id?.toString(),
      floorId: vp.floorId,
      title,
      order: vp.order ?? 1,
      normalizedX: vp.canvasCoordinates?.normalizedX ?? 0.5,
      normalizedY: vp.canvasCoordinates?.normalizedY ?? 0.5,
      latitude: vp.location?.coordinates?.[1] ?? null,
      longitude: vp.location?.coordinates?.[0] ?? null,
      imageAsset: vp.image?.url || '',
      audioUrl,
      audioDuration,
      isVisited: false,
      description,
      triggerRadiusMeters: vp.navigation?.triggerRadiusMeters ?? 4.0,
      targetGazeHeadingDegrees: vp.navigation?.targetGazeHeadingDegrees ?? null,
      isPublished: vp.isPublished ?? true,
      created_at: vp.createdAt,
      updated_at: vp.updatedAt,
    };
  }
}
