import mongoose, { Schema } from 'mongoose';
import { ITourSyncManifest } from '../types/index.js';

const TourSyncManifestSchema = new Schema<ITourSyncManifest>(
  {
    packageVersion: { type: String, required: true, unique: true }, // e.g. "1.0.0"
    contentHash: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
    totalFloors: { type: Number, required: true },
    totalViewpoints: { type: Number, required: true },
    totalLandmarks: { type: Number, required: true },
    supportedLanguages: { type: [String], default: ['en', 'it', 'fr', 'de', 'es'] },
    isCurrent: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TourSyncManifest = mongoose.model<ITourSyncManifest>(
  'TourSyncManifest',
  TourSyncManifestSchema
);
