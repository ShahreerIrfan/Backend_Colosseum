import mongoose, { Schema } from 'mongoose';
import { IPedestrianRoute } from '../types/index.js';

const WaypointSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const PedestrianRouteSchema = new Schema<IPedestrianRoute>(
  {
    routeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    fromLandmarkCode: { type: String, required: true, index: true },
    toLandmarkCode: { type: String, required: true, index: true },
    distanceMeters: { type: Number, required: true },
    estimatedWalkMinutes: { type: Number, required: true },
    waypoints: { type: [WaypointSchema], required: true },
    isAccessibleWheelchair: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    isOneWay: { type: Boolean, default: false },
    instruction: String,
    instructionTranslations: { type: Map, of: String },
  },
  { timestamps: true }
);

export const PedestrianRoute = mongoose.model<IPedestrianRoute>(
  'PedestrianRoute',
  PedestrianRouteSchema
);
