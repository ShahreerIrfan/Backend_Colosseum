import LandmarkRepository from '@repositories/landmarkRepository.js';
import * as LandmarkDTO from '@dtos/landmarkDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.landmarkService;

export default class LandmarkService {
  private landmarkRepository: LandmarkRepository;

  constructor() {
    this.landmarkRepository = new LandmarkRepository();
  }

  async CreateLandmark(data: LandmarkDTO.CreateLandmark): Promise<LandmarkDTO.Landmark> {
    const existing = await this.landmarkRepository.GetByCode(data.code);
    if (existing) {
      throw new Error.ConflictError(Message.landmarkAlreadyExists);
    }
    return this.landmarkRepository.Create(data);
  }

  async GetAllLandmarks(query: LandmarkDTO.QueryLandmark): Promise<{
    landmarks: LandmarkDTO.Landmark[];
    total: number;
  }> {
    return this.landmarkRepository.GetAll(query);
  }

  async GetLandmarkByID(id: string): Promise<LandmarkDTO.Landmark> {
    const landmark = await this.landmarkRepository.GetByID(id);
    if (!landmark) {
      throw new Error.NotFoundError(Message.landmarkNotFound);
    }
    return landmark;
  }

  async UpdateLandmark(
    id: string,
    data: LandmarkDTO.UpdateLandmark
  ): Promise<LandmarkDTO.Landmark> {
    const existing = await this.landmarkRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.landmarkNotFound);
    }

    const updated = await this.landmarkRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(Message.landmarkNotFound);
    }
    return updated;
  }

  async RemoveLandmark(id: string): Promise<boolean> {
    const existing = await this.landmarkRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.landmarkNotFound);
    }
    return this.landmarkRepository.Remove(id);
  }

  async GetActiveOverlays(): Promise<any[]> {
    return this.landmarkRepository.FindActiveOverlays();
  }
}
