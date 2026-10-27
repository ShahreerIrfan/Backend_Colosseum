import type { Request, Response } from 'express';
import LandmarkService from '@services/landmarkService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants, MessageConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.landmarkController;

export default class LandmarkController {
  private landmarkService: LandmarkService;

  constructor() {
    this.landmarkService = new LandmarkService();
  }

  GetAllLandmarks = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.landmarkService.GetAllLandmarks(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.landmarks,
      message: Message.landmarksRetrieved,
    });
  };

  GetLandmarkByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const landmark = await this.landmarkService.GetLandmarkByID(id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: landmark,
      message: Message.landmarkRetrieved,
    });
  };

  CreateLandmark = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.landmarkService.CreateLandmark(data);

    await clearCachePattern('landmarks:*');
    await clearCachePattern('tours:*');
    await clearCachePattern('sync:*');
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: Message.landmarkCreated,
    });
  };

  UpdateLandmark = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.landmarkService.UpdateLandmark(id, data);

    await clearCachePattern('landmarks:*');
    await clearCachePattern('tours:*');
    await clearCachePattern('sync:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: Message.landmarkUpdated,
    });
  };

  RemoveLandmark = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.landmarkService.RemoveLandmark(id);

    await clearCachePattern('landmarks:*');
    await clearCachePattern('tours:*');
    await clearCachePattern('sync:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.landmarkRemoved,
    });
  };
}
