import PedestrianRouteRepository from '@repositories/pedestrianRouteRepository.js';
import * as PedestrianRouteDTO from '@dtos/pedestrianRouteDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { Landmark } from '../models/Landmark.js';

export default class PedestrianRouteService {
  private pedestrianRouteRepository: PedestrianRouteRepository;

  constructor() {
    this.pedestrianRouteRepository = new PedestrianRouteRepository();
  }

  async GetAllRoutes(query: PedestrianRouteDTO.QueryPedestrianRoute, includeDrafts = false): Promise<{
    routes: PedestrianRouteDTO.PedestrianRoute[];
    total: number;
  }> {
    return this.pedestrianRouteRepository.GetAll(query, includeDrafts);
  }

  async GetRouteByID(id: string): Promise<PedestrianRouteDTO.PedestrianRoute> {
    const route = await this.pedestrianRouteRepository.GetByID(id);
    if (!route) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    return route;
  }

  async FindConnectingRoute(
    fromLandmarkCode: string,
    toLandmarkCode: string
  ): Promise<PedestrianRouteDTO.PedestrianRoute> {
    const route = await this.pedestrianRouteRepository.FindBetween(
      fromLandmarkCode,
      toLandmarkCode
    );
    if (!route) {
      throw new Error.NotFoundError(
        `No pedestrian route connecting '${fromLandmarkCode}' to '${toLandmarkCode}'`
      );
    }
    return route;
  }

  async CreateRoute(
    data: PedestrianRouteDTO.CreatePedestrianRoute
  ): Promise<PedestrianRouteDTO.PedestrianRoute> {
    const existing = await this.pedestrianRouteRepository.GetByID(data.routeId);
    if (existing) {
      throw new Error.ConflictError(`Route ID '${data.routeId}' already exists`);
    }
    await this.validateEndpoints(data.fromLandmarkCode, data.toLandmarkCode);
    return this.pedestrianRouteRepository.Create(data);
  }

  async UpdateRoute(
    id: string,
    data: PedestrianRouteDTO.UpdatePedestrianRoute
  ): Promise<PedestrianRouteDTO.PedestrianRoute> {
    const existing = await this.pedestrianRouteRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    if (data.fromLandmarkCode !== undefined || data.toLandmarkCode !== undefined) {
      await this.validateEndpoints(
        data.fromLandmarkCode ?? existing.fromLandmarkCode,
        data.toLandmarkCode ?? existing.toLandmarkCode,
      );
    }
    const updated = await this.pedestrianRouteRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    return updated;
  }

  private async validateEndpoints(from: string, to: string): Promise<void> {
    if (from === to) throw new Error.BadRequestError('Choose two different Landmarks.');
    const count = await Landmark.countDocuments({ code: { $in: [from, to] } });
    if (count !== 2) throw new Error.BadRequestError('Both route Landmarks must exist.');
  }

  async RemoveRoute(id: string): Promise<boolean> {
    const existing = await this.pedestrianRouteRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    return this.pedestrianRouteRepository.Remove(id);
  }
}
