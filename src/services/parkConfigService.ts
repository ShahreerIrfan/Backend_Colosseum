import ParkConfigRepository from '@repositories/parkConfigRepository.js';
import * as ParkConfigDTO from '@dtos/parkConfigDTO.js';
import * as Error from '@errors/concreteErrors.js';

export default class ParkConfigService {
  private parkConfigRepository: ParkConfigRepository;

  constructor() {
    this.parkConfigRepository = new ParkConfigRepository();
  }

  async GetConfig(
    configKey: string = 'archaeological_park_colosseum'
  ): Promise<ParkConfigDTO.ParkConfig> {
    const config = await this.parkConfigRepository.GetConfig(configKey);
    if (!config) {
      throw new Error.NotFoundError('Park configuration not found');
    }
    return config;
  }

  async UpdateConfig(
    configKey: string = 'archaeological_park_colosseum',
    data: ParkConfigDTO.UpdateParkConfig
  ): Promise<ParkConfigDTO.ParkConfig> {
    const updated = await this.parkConfigRepository.UpdateConfig(configKey, data);
    if (!updated) {
      throw new Error.InternalServerError('Failed to update park configuration');
    }
    return updated;
  }
}
