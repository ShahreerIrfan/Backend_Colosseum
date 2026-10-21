export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CanvasCoordinates {
  normalizedX: number;
  normalizedY: number;
}

export interface ViewpointNavigation {
  triggerRadiusMeters: number;
  targetGazeHeadingDegrees: number | null;
}

export interface LocalizedContent {
  title: string;
  description: string;
  audioUrl?: string;
  audioCloudinaryPublicId?: string;
  audioDuration?: string;
}

export interface ViewpointImage {
  url?: string;
  cloudinaryPublicId?: string;
  assetName?: string;
}

export interface IViewpoint {
  viewpointId: string;
  floorId: string;
  order: number;
  canvasCoordinates: CanvasCoordinates;
  location: GeoPoint;
  navigation?: ViewpointNavigation;
  translations: Map<string, LocalizedContent> | Record<string, LocalizedContent>;
  image?: ViewpointImage;
  minimumTierRequired?: string;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ViewpointDTO {
  id: string;
  floorId: string;
  title: string;
  order: number;
  normalizedX: number;
  normalizedY: number;
  latitude: number | null;
  longitude: number | null;
  imageAsset: string;
  audioUrl: string;
  audioDuration: string;
  isVisited: boolean;
  description: string;
  triggerRadiusMeters: number;
  targetGazeHeadingDegrees: number | null;
}

export interface FloorCoordinates {
  latitude: number;
  longitude: number;
}

export interface FloorCalibration {
  centerCoordinates: FloorCoordinates;
  defaultZoom: number;
  mapNorthOffsetDegrees: number;
}

export interface FloorMapAsset {
  assetId: string;
  url?: string;
  cloudinaryPublicId?: string;
}

export interface IFloor {
  floorId: string;
  landmarkCode: string;
  levelIndex: number;
  displayName: string;
  shortName: string;
  floorNumberLabel: string;
  semanticLabel?: string;
  calibration?: FloorCalibration;
  mapAsset?: FloorMapAsset;
  isAccessibleForTier?: string[];
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FloorOverviewDTO {
  id: string;
  floorName: string;
  shortName: string;
  levelIndex: number;
  viewpointCount: number;
  completedCount: number;
}

export interface FloorDetailDTO {
  id: string;
  displayName: string;
  shortName: string;
  floorNumberLabel: string;
  semanticLabel?: string;
  center?: FloorCoordinates;
  defaultZoom?: number;
  mapNorthOffsetDegrees?: number;
  mapAsset?: string;
  mapAssetUrl: string;
  viewpoints: ViewpointDTO[];
  itinerary: ItinerarySegmentDTO[];
}

export interface PointOffset {
  x: number;
  y: number;
}

export interface PointOffsetDTO {
  dx: number;
  dy: number;
}

export interface IItinerarySegment {
  floorId: string;
  fromId: string;
  toId: string;
  points: PointOffset[];
  distanceMeters: number;
  walkingDurationSeconds: number;
  instruction?: string;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItinerarySegmentDTO {
  fromId: string;
  toId: string;
  points: PointOffsetDTO[];
  distanceMeters: number;
  walkingDurationSeconds: number;
  instruction?: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface LandmarkDimensions {
  widthMeters: number;
  heightMeters: number;
}

export interface LandmarkCalibration {
  rotationDegrees: number;
  anchorX: number;
  anchorY: number;
}

export interface LandmarkDisplay {
  zIndex: number;
  minZoom: number;
  maxZoom: number;
}

export interface LandmarkMarker {
  colorHex: string;
  category: string;
  iconName: string;
  labelOffsetY: number;
}

export interface ILandmark {
  code: string;
  name: string;
  description?: string;
  assetPath: string;
  cloudinaryPublicId?: string;
  location: GeoPoint;
  dimensions: LandmarkDimensions;
  calibration?: LandmarkCalibration;
  display?: LandmarkDisplay;
  marker?: LandmarkMarker;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LandmarkOverlayDTO {
  id: string;
  name: string;
  description: string;
  assetPath: string;
  center: {
    latitude: number;
    longitude: number;
  };
  widthMeters: number;
  heightMeters: number;
  rotationDegrees: number;
  anchorX: number;
  anchorY: number;
  zIndex: number;
  minZoom: number;
  maxZoom: number;
  marker?: LandmarkMarker;
}

export interface ILanguage {
  code: string;
  name: string;
  nativeName: string;
  isAvailable: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicket {
  token: string;
  tier: 'full_access' | 'arena_only' | 'general' | string;
  allowedFloorIds: string[];
  validFrom: Date;
  validUntil: Date;
  maxActivations: number;
  currentActivations: number;
  activatedDevices: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketValidationResult {
  isValid: boolean;
  reason?: string;
  token?: string;
  tier?: string;
  allowedFloorIds?: string[];
  expiresAt?: string;
}

export interface ITourSyncManifest {
  packageVersion: string;
  contentHash: string;
  publishedAt: Date | string;
  totalFloors: number;
  totalViewpoints: number;
  totalLandmarks: number;
  supportedLanguages: string[];
  isCurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketSessionDTO {
  ticketToken: string;
  tier: string;
  allowedFloorIds: string[];
  deviceId?: string | null;
  expiresAt: string;
}

export interface IPedestrianRoute {
  routeId: string;
  name: string;
  fromLandmarkCode: string;
  toLandmarkCode: string;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  waypoints: Array<{ latitude: number; longitude: number }>;
  isAccessibleWheelchair: boolean;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PedestrianRouteDTO {
  id: string;
  name: string;
  fromLandmarkCode: string;
  toLandmarkCode: string;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  waypoints: Array<{ latitude: number; longitude: number }>;
  isAccessibleWheelchair: boolean;
}

export interface IParkConfig {
  configKey: string;
  centerCoordinates: { latitude: number; longitude: number };
  boundaryRadiusMeters: number;
  proximityThresholds: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParkConfigDTO {
  configKey: string;
  centerCoordinates: { latitude: number; longitude: number };
  boundaryRadiusMeters: number;
  proximityThresholds: Record<string, number>;
}

export interface OfflineTourBundle {
  manifest: ITourSyncManifest;
  landmarks: LandmarkOverlayDTO[];
  floors: FloorDetailDTO[];
  pedestrianRoutes?: PedestrianRouteDTO[];
  parkConfig?: ParkConfigDTO;
  syncedAt: string;
}

