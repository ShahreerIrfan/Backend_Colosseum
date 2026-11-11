import mongoose, { Schema } from 'mongoose';
import { ILandmark } from '../types/index.js';

const LandmarkSchema = new Schema<ILandmark>(
  {
    localizedText: { type: Map, of: Schema.Types.Mixed },
    code: { type: String, required: true, unique: true, index: true }, // e.g. "colosseum"
    name: { type: String, required: true },
    description: { type: String, default: '' },
    assetPath: { type: String, required: true },
    cloudinaryPublicId: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    thumbnailPublicId: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    dimensions: {
      widthMeters: { type: Number, required: true },
      heightMeters: { type: Number, required: true },
    },
    calibration: {
      rotationDegrees: { type: Number, default: 0.0 },
      anchorX: { type: Number, default: 0.5 },
      anchorY: { type: Number, default: 0.5 },
    },
    display: {
      zIndex: { type: Number, default: 1 },
      minZoom: { type: Number, default: 13.0 },
      maxZoom: { type: Number, default: 21.0 },
    },
    marker: {
      colorHex: { type: String, default: '#C68642' },
      category: { type: String, default: 'monument' },
      iconName: { type: String, default: 'monument' },
      labelOffsetY: { type: Number, default: 0 },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LandmarkSchema.index({ location: '2dsphere' });

export const Landmark = mongoose.model<ILandmark>('Landmark', LandmarkSchema);
