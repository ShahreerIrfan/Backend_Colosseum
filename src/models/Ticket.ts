import mongoose, { Schema } from 'mongoose';
import { ITicket } from '../types/index.js';

const TicketSchema = new Schema<ITicket>(
  {
    token: { type: String, required: true, unique: true, uppercase: true, index: true },
    tier: {
      type: String,
      enum: ['full_access', 'arena_priority', 'arena_only', 'general'],
      default: 'full_access',
    },
    allowedFloorIds: {
      type: [String],
      default: ['floor_underground', 'floor_1', 'floor_2', 'floor_3'],
    },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    maxActivations: { type: Number, default: 1 },
    currentActivations: { type: Number, default: 0 },
    activatedDevices: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
