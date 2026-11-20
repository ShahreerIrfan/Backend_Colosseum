import mongoose, { Schema } from 'mongoose';
import { IFloor } from '../types/index.js';

const FloorPortalSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    fromFloorId: { type: String, required: true },
    toFloorId: { type: String, required: true },
    fromViewpointId: { type: String },
    toViewpointId: { type: String },
    normalizedX: { type: Number, required: true },
    normalizedY: { type: Number, required: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    elevationDeltaMeters: { type: Number, default: 0.0 },
    isAscending: { type: Boolean, default: true },
    triggerRadiusMeters: { type: Number, default: 15.0 },
  },
  { _id: false }
);

const FloorSchema = new Schema<IFloor>(
  {
    localizedText: { type: Map, of: Schema.Types.Mixed },
    floorId: { type: String, required: true, unique: true, index: true }, // e.g. "floor_underground"
    landmarkCode: { type: String, required: true, default: 'colosseum', index: true },
    levelIndex: { type: Number, required: true }, // -1 (underground), 1, 2, 3
    displayName: { type: String, required: true },
    shortName: { type: String, required: true },
    floorNumberLabel: { type: String, required: true },
    semanticLabel: { type: String, default: '' },
    calibration: {
      centerCoordinates: {
        latitude: { type: Number, required: true, default: 41.89021 },
        longitude: { type: Number, required: true, default: 12.492231 },
      },
      defaultZoom: { type: Number, default: 18.6 },
      mapNorthOffsetDegrees: { type: Number, default: -20.0 },
    },
    mapAsset: {
      assetId: { type: String, required: true }, // "underground_map"
      url: { type: String, default: '' },
      cloudinaryPublicId: { type: String, default: '' },
    },
    isAccessibleForTier: {
      type: [String],
      default: ['general', 'arena_priority', 'full_access'],
    },
    isPublished: { type: Boolean, default: true },
    elevationMeters: { type: Number, default: 0.0 },
    autoFloorDetectionEnabled: { type: Boolean, default: true },
    portals: { type: [FloorPortalSchema], default: [] },
  },
  { timestamps: true }
);

export const Floor = mongoose.model<IFloor>('Floor', FloorSchema);
