import mongoose, { Schema } from 'mongoose';
import { IItinerarySegment, PointOffset } from '../types/index.js';

const PointOffsetSchema = new Schema<PointOffset>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const ItinerarySegmentSchema = new Schema<IItinerarySegment>(
  {
    floorId: { type: String, required: true, index: true },
    fromId: { type: String, required: true },
    toId: { type: String, required: true },
    points: { type: [PointOffsetSchema], required: true },
    distanceMeters: { type: Number, default: 0.0 },
    walkingDurationSeconds: { type: Number, default: 0 },
    instruction: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ItinerarySegment = mongoose.model<IItinerarySegment>(
  'ItinerarySegment',
  ItinerarySegmentSchema
);
