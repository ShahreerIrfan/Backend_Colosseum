import ViewpointRepository from '@repositories/viewpointRepository.js';
import * as ViewpointDTO from '@dtos/viewpointDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';
import type { AuthPayload } from '@dtos/authDTO.js';
import { Floor } from '../models/Floor.js';
import { ItinerarySegment } from '../models/ItinerarySegment.js';

const Message = MessageConstants.errorMessage.viewpointService;

export default class ViewpointService {
  private viewpointRepository: ViewpointRepository;

  constructor() {
    this.viewpointRepository = new ViewpointRepository();
  }

  async CreateViewpoint(data: ViewpointDTO.CreateViewpoint): Promise<ViewpointDTO.Viewpoint> {
    const existing = await this.viewpointRepository.GetByID(data.id, 'en', true);
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
    data: ViewpointDTO.UpdateViewpoint,
    actor: AuthPayload
  ): Promise<ViewpointDTO.Viewpoint> {
    const existing = await this.viewpointRepository.GetByID(id, 'en', true);
    if (!existing) {
      throw new Error.NotFoundError(Message.viewpointNotFound);
    }

    const destination = data.floorId ?? existing.floorId;
    if (actor.role === 'MODERATOR') {
      const assigned = actor.assignedFloorIds ?? [];
      if (!assigned.includes(existing.floorId) || !assigned.includes(destination)) {
        throw new Error.AuthorizationError('You need access to both Floors to edit this Viewpoint.');
      }
    }
    if (destination !== existing.floorId) {
      if (!(await Floor.exists({ floorId: destination }))) {
        throw new Error.NotFoundError('The destination Floor does not exist.');
      }
      if (await ItinerarySegment.exists({
        floorId: existing.floorId,
        $or: [{ fromId: existing.id }, { toId: existing.id }],
      })) {
        throw new Error.ConflictError('Remove this Viewpoint from its current itinerary before moving it to another Floor.');
      }
    }

    const updated = await this.viewpointRepository.Update(id, data, existing.floorId);
    if (!updated) {
      throw new Error.ConflictError('The Viewpoint changed while you were editing it. Reload and try again.');
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
