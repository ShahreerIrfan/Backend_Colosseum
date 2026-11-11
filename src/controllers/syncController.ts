import type { Request, Response } from 'express';
import SyncService from '@services/syncService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { HttpConstants, MessageConstants } from '@constants/allConstant.js';
import { bumpTourManifest } from '@utils/tourManifest.js';
import { BadRequestError, NotFoundError } from '@errors/concreteErrors.js';
import { clearCachePattern } from '@utils/redisUtils.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.syncController;

export default class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  GetManifest = async (_req: Request, res: Response): Promise<void> => {
    const manifest = await this.syncService.GetManifest();
    res.set('Cache-Control', 'no-store');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: manifest,
      message: Message.manifestRetrieved,
    });
  };

  RevalidateContent = async (req: Request, res: Response): Promise<void> => {
    const { packageVersion } = req.validatedBody as { packageVersion?: string };
    if (!(await bumpTourManifest(packageVersion))) {
      throw new NotFoundError('No current tour manifest exists.');
    }
    await clearCachePattern('sync:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: 'Visitors will download the current tour on their next sync.',
    });
  };

  GetTourBundle = async (req: Request, res: Response): Promise<void> => {
    const lang = (req.query.lang as string) || (req.query.language as string) || 'en';
    const landmark = req.query.landmark;
    if (landmark !== undefined &&
        (typeof landmark !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(landmark))) {
      throw new BadRequestError('Invalid landmark code.');
    }
    const bundle = await this.syncService.GetOfflineTourBundle(lang, landmark);
    res.set('Cache-Control', 'no-store');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: bundle,
      message: Message.bundleRetrieved,
    });
  };

  GetFloorsOverview = async (_req: Request, res: Response): Promise<void> => {
    const floors = await this.syncService.GetFloorsOverview();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: floors,
      message: Message.floorsRetrieved,
    });
  };

  GetFloorDetail = async (req: Request, res: Response): Promise<void> => {
    const floorId = req.params.floorId || (req.params as any).id;
    const lang = (req.query.lang as string) || (req.query.language as string) || 'en';
    const floor = await this.syncService.GetFloorDetail(floorId as string, lang);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: floor,
      message: Message.floorRetrieved,
    });
  };

  GetLanguages = async (_req: Request, res: Response): Promise<void> => {
    const languages = await this.syncService.GetLanguages();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: languages,
      message: Message.languagesRetrieved,
    });
  };
}
