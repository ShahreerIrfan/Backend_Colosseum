import type { Request, Response } from 'express';
import FloorService from '@services/floorService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;

export default class FloorController {
  private floorService: FloorService;

  constructor() {
    this.floorService = new FloorService();
  }

  GetAllFloors = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.floorService.GetAllFloors(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.floors,
      message: 'Floors retrieved successfully',
    });
  };

  GetFloorByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const floor = await this.floorService.GetFloorByID(id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: floor,
      message: 'Floor retrieved successfully',
    });
  };

  CreateFloor = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.floorService.CreateFloor(data);

    await clearCachePattern('floors:*');
    await clearCachePattern('sync:*');
    await clearCachePattern('tours:*');

    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: 'Floor created successfully',
    });
  };

  UpdateFloor = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.floorService.UpdateFloor(id, data);

    await clearCachePattern('floors:*');
    await clearCachePattern('sync:*');
    await clearCachePattern('tours:*');

    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: 'Floor updated successfully',
    });
  };

  RemoveFloor = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.floorService.RemoveFloor(id);

    await clearCachePattern('floors:*');
    await clearCachePattern('sync:*');
    await clearCachePattern('tours:*');

    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: 'Floor removed successfully',
    });
  };
}
