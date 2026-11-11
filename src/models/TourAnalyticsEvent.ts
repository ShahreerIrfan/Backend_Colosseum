import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  _id: { type: String, required: true },
  installationId: { type: String, required: true },
  sessionId: { type: String, required: true },
  type: { type: String, required: true },
  occurredAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  tourKind: { type: String, required: true },
  landmarkId: String,
  floorId: String,
  viewpointId: String,
  language: { type: String, required: true },
}, { versionKey: false });

export const TourAnalyticsEvent = mongoose.model('TourAnalyticsEvent', schema);
