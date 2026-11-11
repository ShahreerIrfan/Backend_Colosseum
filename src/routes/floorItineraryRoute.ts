import { Router } from 'express';
import authenticateToken from '@middlewares/authenticateToken.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { Validator } from '@middlewares/requestValidator.js';
import ResponseHandler from '@utils/responseHandler.js';
import {
  createSegment, floorItineraryParams, segmentParams, updateSegment,
} from '@dtos/floorItineraryDTO.js';
import {
  createFloorConnection, deleteFloorConnection, listFloorItinerary, updateFloorConnection,
} from '@services/floorItineraryService.js';

const router = Router();
const resource = 'Floor Itinerary';
router.use(authenticateToken);
router.get('/:floorId', requirePermission(resource, 'Read'), Validator.params(floorItineraryParams),
  async (req, res) => {
    ResponseHandler.send(res, 200, { data: await listFloorItinerary(req.validatedParams.floorId) });
  },
);
router.post('/:floorId', requirePermission(resource, 'Create'), Validator.params(floorItineraryParams),
  Validator.body(createSegment), async (req, res) => {
    ResponseHandler.send(res, 201, {
      data: await createFloorConnection(req.validatedParams.floorId, req.validatedBody),
    });
  },
);
router.patch('/:floorId/:segmentId', requirePermission(resource, 'Update'), Validator.params(segmentParams),
  Validator.body(updateSegment), async (req, res) => {
    const { floorId, segmentId } = req.validatedParams;
    ResponseHandler.send(res, 200, { data: await updateFloorConnection(floorId, segmentId, req.validatedBody) });
  },
);
router.delete('/:floorId/:segmentId', requirePermission(resource, 'Delete'), Validator.params(segmentParams),
  async (req, res) => {
    const { floorId, segmentId } = req.validatedParams;
    await deleteFloorConnection(floorId, segmentId);
    res.sendStatus(204);
  },
);
export default router;
