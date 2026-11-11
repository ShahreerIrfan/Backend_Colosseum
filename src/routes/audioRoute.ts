import express, { Router } from 'express';
import AudioController from '@controllers/audioController.js';
import { Validator } from '@middlewares/requestValidator.js';
import { cacheMiddleware } from '@middlewares/redisCache.js';
import * as AudioDTO from '@dtos/audioDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const audioController = new AudioController();

router
  .route('/')
  .get(
    Validator.query(AudioDTO.QueryAudioSchema),
    cacheMiddleware('audio'),
    audioController.GetAllAudioTracks
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('audio-track'), audioController.GetAudioTrackByID);

export default router;
