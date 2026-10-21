import type { Request, Response } from 'express';
import SyncService from '@services/syncService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { HttpConstants, MessageConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.syncController;

export default class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  GetManifest = async (_req: Request, res: Response): Promise<void> => {
    const manifest = await this.syncService.GetManifest();
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: manifest,
      message: Message.manifestRetrieved,
    });
  };

  GetTourBundle = async (req: Request, res: Response): Promise<void> => {
    const lang = (req.query.lang as string) || (req.query.language as string) || 'en';
    const bundle = await this.syncService.GetOfflineTourBundle(lang);
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
