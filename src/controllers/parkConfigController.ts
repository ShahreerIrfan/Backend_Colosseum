import type { Request, Response } from 'express';
import ParkConfigService from '@services/parkConfigService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;

export default class ParkConfigController {
  private parkConfigService: ParkConfigService;

  constructor() {
    this.parkConfigService = new ParkConfigService();
  }

  GetConfig = async (_req: Request, res: Response): Promise<void> => {
    const config = await this.parkConfigService.GetConfig();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: config,
      message: 'Park configuration retrieved successfully',
    });
  };

  UpdateConfig = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const updated = await this.parkConfigService.UpdateConfig(
      'archaeological_park_colosseum',
      data
    );

    await clearCachePattern('park:config:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: 'Park configuration updated successfully',
    });
  };
}
