import type { Request, Response } from 'express';
import AudioService from '@services/audioService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants, MessageConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.audioController;

export default class AudioController {
  private audioService: AudioService;

  constructor() {
    this.audioService = new AudioService();
  }

  GetAllAudioTracks = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.audioService.GetAllAudioTracks(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.audioTracks,
      message: Message.audioTracksRetrieved,
    });
  };

  GetAudioTrackByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const track = await this.audioService.GetAudioTrackByID(id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: track,
      message: Message.audioTrackRetrieved,
    });
  };

  CreateAudioTrack = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.audioService.CreateAudioTrack(data);

    await clearCachePattern('audio:*');
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: Message.audioTrackCreated,
    });
  };

  UpdateAudioTrack = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.audioService.UpdateAudioTrack(id, data);

    await clearCachePattern('audio:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: Message.audioTrackUpdated,
    });
  };

  RemoveAudioTrack = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.audioService.RemoveAudioTrack(id);

    await clearCachePattern('audio:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.audioTrackRemoved,
    });
  };
}
