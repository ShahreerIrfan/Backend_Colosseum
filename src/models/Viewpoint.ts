import mongoose, { Schema } from 'mongoose';
import { IViewpoint, LocalizedContent } from '../types/index.js';

const LocalizedContentSchema = new Schema<LocalizedContent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    // Optional fields kept to read historical public audio previews.
    audioUrl: String,
    audioCloudinaryPublicId: String,
    audioDuration: String,
  },
  { _id: false }
);

const ViewpointSchema = new Schema<IViewpoint>(
  {
    viewpointId: { type: String, required: true, unique: true, index: true },
    floorId: { type: String, required: true, index: true },
    order: { type: Number, required: true, index: true },

    canvasCoordinates: {
      normalizedX: { type: Number, required: true },
      normalizedY: { type: Number, required: true },
    },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    navigation: {
      triggerRadiusMeters: { type: Number, default: 4.0 },
      targetGazeHeadingDegrees: { type: Number, default: null },
    },

    translations: {
      type: Map,
      of: LocalizedContentSchema,
      required: true,
    },

    image: {
      url: { type: String, default: '' },
      cloudinaryPublicId: { type: String, default: '' },
      assetName: { type: String, default: '' },
    },

    minimumTierRequired: {
      type: String,
      default: 'general',
    },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ViewpointSchema.index({ location: '2dsphere' });

export const Viewpoint = mongoose.model<IViewpoint>('Viewpoint', ViewpointSchema);
