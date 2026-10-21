import mongoose, { Schema } from 'mongoose';
import { ILanguage } from '../types/index.js';

const LanguageSchema = new Schema<ILanguage>(
  {
    code: { type: String, required: true, unique: true, index: true }, // e.g. "en", "it"
    name: { type: String, required: true }, // English
    nativeName: { type: String, required: true }, // English / Italiano
    isAvailable: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Language = mongoose.model<ILanguage>('Language', LanguageSchema);
