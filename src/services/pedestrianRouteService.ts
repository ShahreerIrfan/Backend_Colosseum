import PedestrianRouteRepository from '@repositories/pedestrianRouteRepository.js';
import * as PedestrianRouteDTO from '@dtos/pedestrianRouteDTO.js';
import * as Error from '@errors/concreteErrors.js';

export default class PedestrianRouteService {
  private pedestrianRouteRepository: PedestrianRouteRepository;

  constructor() {
    this.pedestrianRouteRepository = new PedestrianRouteRepository();
  }

  async GetAllRoutes(query: PedestrianRouteDTO.QueryPedestrianRoute): Promise<{
    routes: PedestrianRouteDTO.PedestrianRoute[];
    total: number;
  }> {
    return this.pedestrianRouteRepository.GetAll(query);
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
    const updated = await this.pedestrianRouteRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    return updated;
  }

  async RemoveRoute(id: string): Promise<boolean> {
    const existing = await this.pedestrianRouteRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(`Pedestrian route '${id}' not found`);
    }
    return this.pedestrianRouteRepository.Remove(id);
  }
}
