import type { Request, Response } from 'express';
import ViewpointService from '@services/viewpointService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants, MessageConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.viewpointController;

export default class ViewpointController {
  private viewpointService: ViewpointService;

  constructor() {
    this.viewpointService = new ViewpointService();
  }

  GetAllViewpoints = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.viewpointService.GetAllViewpoints(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.viewpoints,
      message: Message.viewpointsRetrieved,
    });
  };

  GetViewpointByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const lang = (req.query.lang as string) || (req.query.language as string) || 'en';
    const viewpoint = await this.viewpointService.GetViewpointByID(id, lang);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: viewpoint,
      message: Message.viewpointRetrieved,
    });
  };

  CreateViewpoint = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.viewpointService.CreateViewpoint(data);

    await clearCachePattern('viewpoints:*');
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: Message.viewpointCreated,
    });
  };

  UpdateViewpoint = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.viewpointService.UpdateViewpoint(id, data);

    await clearCachePattern('viewpoints:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: Message.viewpointUpdated,
    });
  };

  RemoveViewpoint = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.viewpointService.RemoveViewpoint(id);

    await clearCachePattern('viewpoints:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.viewpointRemoved,
    });
  };
}
