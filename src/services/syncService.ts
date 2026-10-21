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

  async GetOfflineTourBundle(languageCode: string = 'en'): Promise<any> {
    const [manifest, landmarks, floors, pedestrianRoutes, parkConfig] = await Promise.all([
      this.syncRepository.GetCurrentManifest(),
      this.syncRepository.GetActiveLandmarks(),
      this.syncRepository.GetAllFloors(),
      this.syncRepository.GetAllPedestrianRoutes(),
      this.syncRepository.GetParkConfig(),
    ]);

    const enrichedFloors = await Promise.all(
      floors.map(async (floor) => {
        const viewpoints = await this.syncRepository.GetViewpointsByFloor(
          floor.floorId,
          languageCode
        );
        const itinerary = await this.syncRepository.GetItinerariesByFloor(floor.floorId);

        return {
          id: floor.floorId,
          displayName: floor.displayName,
          shortName: floor.shortName,
          floorNumberLabel: floor.floorNumberLabel,
          semanticLabel: floor.semanticLabel,
          center: floor.calibration?.centerCoordinates || {
            latitude: 41.89021,
            longitude: 12.492231,
          },
          defaultZoom: floor.calibration?.defaultZoom || 18.6,
          mapNorthOffsetDegrees: floor.calibration?.mapNorthOffsetDegrees || -20.0,
          mapAsset: floor.mapAsset?.assetId || 'level_1_map',
          mapAssetUrl: floor.mapAsset?.url || '',
          viewpoints,
          itinerary,
        };
      })
    );

    return {
      manifest,
      landmarks,
      floors: enrichedFloors,
      pedestrianRoutes,
      parkConfig,
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
    const itinerary = await this.syncRepository.GetItinerariesByFloor(floorId);

    return {
      id: floor.floorId,
      displayName: floor.displayName,
      shortName: floor.shortName,
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
