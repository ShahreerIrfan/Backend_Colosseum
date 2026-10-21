import crypto from 'node:crypto';
import { TourSyncManifest } from '../models/TourSyncManifest.js';
import { Floor } from '../models/Floor.js';
import { Landmark } from '../models/Landmark.js';
import { Viewpoint } from '../models/Viewpoint.js';
import { ItinerarySegment } from '../models/ItinerarySegment.js';
import { Language } from '../models/Language.js';
import { PedestrianRoute } from '../models/PedestrianRoute.js';
import { ParkConfig } from '../models/ParkConfig.js';
import * as SyncDTO from '@dtos/syncDTO.js';

export default class SyncRepository {
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

  async GetAllFloors(): Promise<any[]> {
    return Floor.find({ isPublished: true }).sort({ levelIndex: 1 }).lean().exec();
  }

  async GetFloorById(floorId: string): Promise<any | null> {
    return Floor.findOne({ floorId, isPublished: true }).lean().exec();
  }

  async GetViewpointsByFloor(floorId: string, languageCode: string = 'en'): Promise<any[]> {
    const raw = await Viewpoint.find({ floorId, isPublished: true }).sort({ order: 1 }).lean().exec();
    return raw.map((vp) => this.resolveViewpoint(vp, languageCode));
  }

  async GetItinerariesByFloor(floorId: string): Promise<any[]> {
    const segments = await ItinerarySegment.find({ floorId, isPublished: true }).lean().exec();
    return segments.map((seg) => ({
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

  async GetActiveLandmarks(): Promise<any[]> {
    const raw = await Landmark.find({ isPublished: true }).sort({ 'display.zIndex': 1 }).lean().exec();
    return raw.map((lm: any) => ({
      id: lm.code,
      name: lm.name,
      description: lm.description || '',
      assetPath: lm.assetPath,
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

  async GetAllPedestrianRoutes(): Promise<any[]> {
    const raw = await PedestrianRoute.find({ isPublished: true }).lean().exec();
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
    }));
  }

  async GetParkConfig(): Promise<any | null> {
    const doc = await ParkConfig.findOne({ configKey: 'archaeological_park_colosseum' }).lean().exec();
    if (!doc) return null;
    return {
      configKey: doc.configKey,
      centerCoordinates: doc.centerCoordinates,
      boundaryRadiusMeters: doc.boundaryRadiusMeters,
      proximityThresholds:
        doc.proximityThresholds instanceof Map
          ? Object.fromEntries(doc.proximityThresholds)
          : doc.proximityThresholds || {},
    };
  }

  async CountViewpointsByFloor(floorId: string): Promise<number> {
    return Viewpoint.countDocuments({ floorId, isPublished: true }).exec();
  }

  private resolveViewpoint(vp: any, languageCode: string = 'en') {
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
    };
  }
}
