import SyncRepository from '@repositories/syncRepository.js';
import * as SyncDTO from '@dtos/syncDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.syncService;

export default class SyncService {
  private syncRepository: SyncRepository;

  constructor() {
    this.syncRepository = new SyncRepository();
  }

  async GetManifest(): Promise<SyncDTO.TourSyncManifest> {
    const manifest = await this.syncRepository.GetCurrentManifest();
    if (!manifest) {
      throw new Error.NotFoundError(Message.manifestNotFound);
    }
    return manifest;
  }

  async GetOfflineTourBundle(languageCode: string = 'en', landmarkCode?: string): Promise<any> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const before = await this.syncRepository.GetCurrentManifest();
      const bundle = await this.BuildOfflineTourBundle(languageCode, landmarkCode);
      const after = await this.syncRepository.GetCurrentManifest();
      if (before.contentHash === after.contentHash && before.packageVersion === after.packageVersion) {
        return { ...bundle, manifest: after };
      }
    }
    throw new Error.ConflictError('Tour content changed during sync. Try again shortly.');
  }

  private async BuildOfflineTourBundle(languageCode: string, landmarkCode?: string) {
    const [publishedLandmarks, floors, pedestrianRoutes] = await Promise.all([
      this.syncRepository.GetActiveLandmarks(languageCode),
      this.syncRepository.GetAllFloors(landmarkCode),
      this.syncRepository.GetAllPedestrianRoutes(languageCode, landmarkCode),
    ]);
    const publishedIds = new Set(publishedLandmarks.map((landmark) => landmark.id));
    const landmarks = landmarkCode
      ? publishedLandmarks.filter((landmark) => landmark.id === landmarkCode)
      : publishedLandmarks;
    if (landmarkCode && landmarks.length === 0) {
      throw new Error.NotFoundError('Published landmark not found.');
    }

    const enrichedFloors = await Promise.all(
      floors.filter((floor) => publishedIds.has(floor.landmarkCode)).map(async (floor) => {
        const viewpoints = await this.syncRepository.GetViewpointsByFloor(
          floor.floorId,
          languageCode
        );
        const translated = this.syncRepository.localizedText<{ title: string }>(floor.localizedText, languageCode);
        const itinerary = await this.syncRepository.GetItinerariesByFloor(
          floor.floorId, viewpoints.map((viewpoint) => viewpoint.id)
        );

        return {
          id: floor.floorId,
          landmarkCode: floor.landmarkCode,
          displayName: translated?.title ?? floor.displayName,
          shortName: translated?.title ?? floor.shortName,
          floorNumberLabel: floor.floorNumberLabel,
          semanticLabel: floor.semanticLabel,
          center: floor.calibration?.centerCoordinates || {
            latitude: 41.89021,
            longitude: 12.492231,
          },
          defaultZoom: floor.calibration?.defaultZoom ?? 18.6,
          mapNorthOffsetDegrees: floor.calibration?.mapNorthOffsetDegrees ?? -20.0,
          mapAsset: floor.mapAsset?.assetId || 'level_1_map',
          mapAssetUrl: floor.mapAsset?.url || '',
          viewpoints,
          itinerary,
        };
      })
    );

    return {
      landmarks,
      floors: enrichedFloors,
      pedestrianRoutes: pedestrianRoutes.filter((route) =>
        publishedIds.has(route.fromLandmarkCode) && publishedIds.has(route.toLandmarkCode)),
      syncedAt: new Date().toISOString(),
    };
  }

  async GetFloorsOverview(): Promise<any[]> {
    const floors = await this.syncRepository.GetAllFloors();
    return Promise.all(
      floors.map(async (f) => {
        const count = await this.syncRepository.CountViewpointsByFloor(f.floorId);
        return {
          id: f.floorId,
          floorName: f.displayName,
          shortName: f.shortName,
          levelIndex: f.levelIndex,
          viewpointCount: count,
          completedCount: 0,
        };
      })
    );
  }

  async GetFloorDetail(floorId: string, languageCode: string = 'en'): Promise<any> {
    const floor = await this.syncRepository.GetFloorById(floorId);
    if (!floor) {
      throw new Error.NotFoundError(`Floor '${floorId}' not found.`);
    }

    const viewpoints = await this.syncRepository.GetViewpointsByFloor(floorId, languageCode);
    const translated = this.syncRepository.localizedText<{ title: string }>(floor.localizedText, languageCode);
    const itinerary = await this.syncRepository.GetItinerariesByFloor(
      floorId, viewpoints.map((viewpoint) => viewpoint.id)
    );

    return {
      id: floor.floorId,
      landmarkCode: floor.landmarkCode,
      displayName: translated?.title ?? floor.displayName,
      shortName: translated?.title ?? floor.shortName,
      floorNumberLabel: floor.floorNumberLabel,
      semanticLabel: floor.semanticLabel,
      center: floor.calibration?.centerCoordinates,
      defaultZoom: floor.calibration?.defaultZoom,
      mapNorthOffsetDegrees: floor.calibration?.mapNorthOffsetDegrees,
      mapAsset: floor.mapAsset?.assetId,
      mapAssetUrl: floor.mapAsset?.url || '',
      viewpoints,
      itinerary,
    };
  }

  async GetLanguages(): Promise<any[]> {
    return this.syncRepository.GetAllLanguages();
  }
}
