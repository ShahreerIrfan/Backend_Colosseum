import express, { Router } from 'express';
import AudioController from '@controllers/audioController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
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
  )
  .post(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(AudioDTO.CreateAudioSchema),
    audioController.CreateAudioTrack
  );

router
  .route('/:id')
  .all(Validator.params(CommonItemDTO.IdSchema))
  .get(cacheMiddleware('audio-track'), audioController.GetAudioTrackByID)
  .patch(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
    Validator.body(AudioDTO.UpdateAudioSchema),
    audioController.UpdateAudioTrack
  )
  .delete(authenticateToken, authorizeRole.adminOnly, audioController.RemoveAudioTrack);

export default router;
