import type { Request, Response } from 'express';
import PedestrianRouteService from '@services/pedestrianRouteService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants } from '@constants/allConstant.js';
import { bumpTourManifest } from '@utils/tourManifest.js';

const HttpStatus = HttpConstants.statusCode;

export default class PedestrianRouteController {
  private pedestrianRouteService: PedestrianRouteService;

  constructor() {
    this.pedestrianRouteService = new PedestrianRouteService();
  }

  GetAllRoutes = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.pedestrianRouteService.GetAllRoutes(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.routes,
      message: 'Pedestrian routes retrieved successfully',
    });
  };

  GetAdminRoutes = async (req: Request, res: Response): Promise<void> => {
    const { routes } = await this.pedestrianRouteService.GetAllRoutes(req.validatedQuery, true);
    ResponseHandler.send(res, HttpStatus.OK.code, { data: routes });
  };

  private async invalidateRoutes(): Promise<void> {
    await bumpTourManifest();
    await Promise.all([
      clearCachePattern('routes:pedestrian:*'),
      clearCachePattern('route:pedestrian:*'),
      clearCachePattern('sync:*'),
    ]);
  }

  GetRouteByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const route = await this.pedestrianRouteService.GetRouteByID(id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: route,
      message: 'Pedestrian route retrieved successfully',
    });
  };

  FindRoute = async (req: Request, res: Response): Promise<void> => {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const route = await this.pedestrianRouteService.FindConnectingRoute(from, to);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: route,
      message: 'Connecting pedestrian route found successfully',
    });
  };

  CreateRoute = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.pedestrianRouteService.CreateRoute(data);

    await this.invalidateRoutes();
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: 'Pedestrian route created successfully',
    });
  };

  UpdateRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.pedestrianRouteService.UpdateRoute(id, data);

    await this.invalidateRoutes();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: 'Pedestrian route updated successfully',
    });
  };

  RemoveRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.pedestrianRouteService.RemoveRoute(id);

    await this.invalidateRoutes();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: 'Pedestrian route deleted successfully',
    });
  };
}
