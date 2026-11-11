import { randomUUID } from 'node:crypto';
import { TourSyncManifest } from '../models/TourSyncManifest.js';
import { ConflictError } from '@errors/concreteErrors.js';

export async function bumpTourManifest(packageVersion?: string): Promise<boolean> {
  try {
    const result = await TourSyncManifest.updateOne(
      { isCurrent: true },
      { $set: {
        contentHash: randomUUID(),
        publishedAt: new Date(),
        ...(packageVersion === undefined ? {} : { packageVersion }),
      } },
    );
    return result.matchedCount > 0;
  } catch (error) {
    if (packageVersion !== undefined && (error as { code?: number })?.code === 11000) {
      throw new ConflictError('This package version already exists.');
    }
    throw error;
  }
}
