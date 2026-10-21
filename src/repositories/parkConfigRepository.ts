import { ParkConfig } from '../models/ParkConfig.js';
import * as ParkConfigDTO from '@dtos/parkConfigDTO.js';

export default class ParkConfigRepository {
  async GetConfig(
    configKey: string = 'archaeological_park_colosseum'
  ): Promise<ParkConfigDTO.ParkConfig | null> {
    const doc = await ParkConfig.findOne({ configKey }).lean().exec();
    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async UpdateConfig(
    configKey: string,
    data: ParkConfigDTO.UpdateParkConfig
  ): Promise<ParkConfigDTO.ParkConfig | null> {
    const updated = await ParkConfig.findOneAndUpdate(
      { configKey },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return this.mapToDTO(updated);
  }

  private mapToDTO(doc: any): ParkConfigDTO.ParkConfig {
    const thresholds =
      doc.proximityThresholds instanceof Map
        ? Object.fromEntries(doc.proximityThresholds)
        : (doc.proximityThresholds as Record<string, number>) || {};

    return {
      configKey: doc.configKey,
      centerCoordinates: {
        latitude: doc.centerCoordinates?.latitude ?? 41.89021,
        longitude: doc.centerCoordinates?.longitude ?? 12.492231,
      },
      boundaryRadiusMeters: doc.boundaryRadiusMeters ?? 600,
      proximityThresholds: thresholds,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }
}
