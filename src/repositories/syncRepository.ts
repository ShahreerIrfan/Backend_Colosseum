import crypto from 'node:crypto';
import { TourSyncManifest } from '../models/TourSyncManifest.js';
import { Floor } from '../models/Floor.js';
import { Landmark } from '../models/Landmark.js';
import { Viewpoint } from '../models/Viewpoint.js';
import { ItinerarySegment } from '../models/ItinerarySegment.js';
import { Language } from '../models/Language.js';
import { PedestrianRoute } from '../models/PedestrianRoute.js';
import ViewpointRepository from '@repositories/viewpointRepository.js';
import * as SyncDTO from '@dtos/syncDTO.js';

export default class SyncRepository {
  private readonly viewpoints = new ViewpointRepository();

  async GetCurrentManifest(): Promise<SyncDTO.TourSyncManifest> {
    const manifest = await TourSyncManifest.findOne({ isCurrent: true }).lean().exec();
    if (!manifest) {
      return {
        packageVersion: '1.0.0',
        contentHash: crypto.createHash('md5').update('colosseum_default_v1').digest('hex'),
        publishedAt: new Date().toISOString(),
        totalFloors: 4,
        totalViewpoints: 28,
        totalLandmarks: 5,
        supportedLanguages: ['en', 'it', 'fr', 'de', 'es'],
        isCurrent: true,
      };
    }

    return {
      packageVersion: manifest.packageVersion,
      contentHash: manifest.contentHash,
      publishedAt: manifest.publishedAt,
      totalFloors: manifest.totalFloors,
      totalViewpoints: manifest.totalViewpoints,
      totalLandmarks: manifest.totalLandmarks,
      supportedLanguages: manifest.supportedLanguages,
      isCurrent: manifest.isCurrent,
    };
  }

  async GetAllFloors(landmarkCode?: string): Promise<any[]> {
    return Floor.find({ isPublished: true, ...(landmarkCode && { landmarkCode }) })
      .sort({ levelIndex: 1 }).lean().exec();
  }

  async GetFloorById(floorId: string): Promise<any | null> {
    return Floor.findOne({ floorId, isPublished: true }).lean().exec();
  }

  async GetViewpointsByFloor(floorId: string, languageCode: string = 'en'): Promise<any[]> {
    return this.viewpoints.FindByFloor(floorId, languageCode);
  }

  async GetItinerariesByFloor(floorId: string, viewpointIds: string[]): Promise<any[]> {
    const stops = [...viewpointIds, 'ENTRY', 'EXIT'];
    const segments = await ItinerarySegment.find({
      floorId, isPublished: true, fromId: { $in: stops }, toId: { $in: stops },
    }).lean().exec();
    return segments.map((seg) => ({
      coordinateSpace: seg.coordinateSpace,
      fromId: seg.fromId,
      toId: seg.toId,
      points: (seg.points || []).map((p: any) => ({ dx: p.x, dy: p.y })),
      distanceMeters: seg.distanceMeters,
      walkingDurationSeconds: seg.walkingDurationSeconds,
      instruction: seg.instruction,
      isCompleted: false,
      isActive: false,
    }));
  }

  async GetAllLanguages(): Promise<any[]> {
    return Language.find({ isAvailable: true }).sort({ displayOrder: 1 }).lean().exec();
  }

  async GetActiveLandmarks(languageCode = 'en', landmarkCode?: string): Promise<any[]> {
    const raw = await Landmark.find({ isPublished: true, ...(landmarkCode && { code: landmarkCode }) })
      .sort({ 'display.zIndex': 1 }).lean().exec();
    return raw.map((lm: any) => {
      const translated = this.localizedText<{ title: string; description: string }>(
        lm.localizedText, languageCode,
      );
      return ({
      id: lm.code,
      name: translated?.title ?? lm.name,
      description: translated?.description ?? lm.description ?? '',
      era: lm.era || '',
      builders: lm.builders || '',
      historicalSummary: lm.historicalSummary || '',
      securityGuidelines: lm.securityGuidelines || [],
      levelHighlights: lm.levelHighlights || [],
      audioIntroText: lm.audioIntroText || '',
      assetPath: lm.assetPath,
      thumbnailUrl: lm.thumbnailUrl || '',
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
      });
    });
  }

  localizedText<T>(translations: Record<string, T> | Map<string, T> | undefined, languageCode: string): T | undefined {
    if (translations instanceof Map) return translations.get(languageCode);
    return translations && Object.hasOwn(translations, languageCode)
      ? translations[languageCode]
      : undefined;
  }

  async GetAllPedestrianRoutes(languageCode = 'en', landmarkCode?: string): Promise<any[]> {
    const raw = await PedestrianRoute.find({
      isPublished: true,
      ...(landmarkCode && { $or: [{ fromLandmarkCode: landmarkCode }, { toLandmarkCode: landmarkCode }] }),
    }).lean().exec();
    return raw.map((r: any) => ({
      routeId: r.routeId,
      name: r.name,
      fromLandmarkCode: r.fromLandmarkCode,
      toLandmarkCode: r.toLandmarkCode,
      distanceMeters: r.distanceMeters,
      estimatedWalkMinutes: r.estimatedWalkMinutes,
      waypoints: (r.waypoints || []).map((w: any) => ({
        latitude: w.latitude,
        longitude: w.longitude,
      })),
      isAccessibleWheelchair: r.isAccessibleWheelchair,
      isOneWay: r.isOneWay ?? false,
      instruction: this.localizedText<string>(r.instructionTranslations, languageCode) ?? r.instruction ?? '',
    }));
  }

  async CountViewpointsByFloor(floorId: string): Promise<number> {
    return Viewpoint.countDocuments({ floorId, isPublished: true }).exec();
  }

}
