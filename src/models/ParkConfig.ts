import mongoose, { Schema } from 'mongoose';
import { IParkConfig } from '../types/index.js';

const ParkConfigSchema = new Schema<IParkConfig>(
  {
    configKey: { type: String, required: true, unique: true, default: 'archaeological_park_colosseum' },
    centerCoordinates: {
      latitude: { type: Number, required: true, default: 41.89021 },
      longitude: { type: Number, required: true, default: 12.492231 },
    },
    boundaryRadiusMeters: { type: Number, required: true, default: 600 },
    proximityThresholds: {
      type: Map,
      of: Number,
      default: {
        colosseum: 120,
        romanForum: 100,
        archConstantine: 70,
        ludusMagnus: 80,
        templeVenusRome: 80,
      },
    },
  },
  { timestamps: true }
);

export const ParkConfig = mongoose.model<IParkConfig>('ParkConfig', ParkConfigSchema);
