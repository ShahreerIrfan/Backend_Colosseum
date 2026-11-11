import FloorRepository from '@repositories/floorRepository.js';
import * as FloorDTO from '@dtos/floorDTO.js';
import * as Error from '@errors/concreteErrors.js';

export default class FloorService {
  private floorRepository: FloorRepository;

  constructor() {
    this.floorRepository = new FloorRepository();
  }

  async CreateFloor(data: FloorDTO.CreateFloor): Promise<FloorDTO.Floor> {
    const existing = await this.floorRepository.GetByID(data.floorId);
    if (existing) {
      throw new Error.ConflictError(`Floor with ID '${data.floorId}' already exists.`);
    }
    try {
      return await this.floorRepository.Create(data);
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        throw new Error.ConflictError(`Floor with ID '${data.floorId}' already exists.`);
      }
      throw error;
    }
  }

  async GetAllFloors(query: FloorDTO.QueryFloor): Promise<{
    floors: FloorDTO.Floor[];
    total: number;
  }> {
    return this.floorRepository.GetAll(query);
  }

  async GetFloorByID(id: string): Promise<FloorDTO.Floor> {
    const floor = await this.floorRepository.GetByID(id);
    if (!floor) {
      throw new Error.NotFoundError(`Floor with ID '${id}' not found.`);
    }
    return floor;
  }

  async UpdateFloor(id: string, data: FloorDTO.UpdateFloor): Promise<FloorDTO.Floor> {
    const existing = await this.floorRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(`Floor with ID '${id}' not found.`);
    }

    const updated = await this.floorRepository.Update(id, data).catch((error: unknown) => {
      if ((error as { code?: number })?.code === 11000 && data.floorId) {
        throw new Error.ConflictError(`Floor with ID '${data.floorId}' already exists.`);
      }
      throw error;
    });
    if (!updated) {
      throw new Error.NotFoundError(`Floor with ID '${id}' not found.`);
    }
    return updated;
  }

  async RemoveFloor(id: string): Promise<boolean> {
    return this.floorRepository.Remove(id);
  }
}
