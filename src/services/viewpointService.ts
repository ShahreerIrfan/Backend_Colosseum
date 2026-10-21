import ViewpointRepository from '@repositories/viewpointRepository.js';
import * as ViewpointDTO from '@dtos/viewpointDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.viewpointService;

export default class ViewpointService {
  private viewpointRepository: ViewpointRepository;

  constructor() {
    this.viewpointRepository = new ViewpointRepository();
  }

  async CreateViewpoint(data: ViewpointDTO.CreateViewpoint): Promise<ViewpointDTO.Viewpoint> {
    const existing = await this.viewpointRepository.GetByID(data.id);
    if (existing) {
      throw new Error.ConflictError('Viewpoint with this ID already exists');
    }
    return this.viewpointRepository.Create(data);
  }

  async GetAllViewpoints(query: ViewpointDTO.QueryViewpoint): Promise<{
    viewpoints: ViewpointDTO.Viewpoint[];
    total: number;
  }> {
    return this.viewpointRepository.GetAll(query);
  }

  async GetViewpointByID(id: string, lang: string = 'en'): Promise<ViewpointDTO.Viewpoint> {
    const viewpoint = await this.viewpointRepository.GetByID(id, lang);
    if (!viewpoint) {
      throw new Error.NotFoundError(Message.viewpointNotFound);
    }
    return viewpoint;
  }

  async UpdateViewpoint(
    id: string,
    data: ViewpointDTO.UpdateViewpoint
  ): Promise<ViewpointDTO.Viewpoint> {
    const existing = await this.viewpointRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.viewpointNotFound);
    }

    const updated = await this.viewpointRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(Message.viewpointNotFound);
    }
    return updated;
  }

  async RemoveViewpoint(id: string): Promise<boolean> {
    const existing = await this.viewpointRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.viewpointNotFound);
    }
    return this.viewpointRepository.Remove(id);
  }

  async GetViewpointsByFloor(
    floorId: string,
    lang: string = 'en'
  ): Promise<ViewpointDTO.Viewpoint[]> {
    return this.viewpointRepository.FindByFloor(floorId, lang);
  }
}
