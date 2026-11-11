import { Router } from 'express';
import { z } from 'zod';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
import { Validator } from '@middlewares/requestValidator.js';
import { BadRequestError, NotFoundError } from '@errors/concreteErrors.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { bumpTourManifest } from '@utils/tourManifest.js';
import ResponseHandler from '@utils/responseHandler.js';
import { Floor } from '../models/Floor.js';
import { Landmark } from '../models/Landmark.js';
import { Language } from '../models/Language.js';
import { Viewpoint } from '../models/Viewpoint.js';

const params = z.object({
  kind: z.enum(['landmark', 'floor', 'viewpoint']),
  id: z.string().min(1).max(200),
  language: z.string().regex(/^[a-z]{2,3}(-[a-zA-Z0-9]{2,8})*$/),
});
const text = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(12000).default(''),
});
type Target = z.infer<typeof params>;

async function readTarget({ kind, id }: Target) {
  if (kind === 'floor') return Floor.findOne({ floorId: id }).lean().exec();
  if (kind === 'landmark') return Landmark.findOne({ code: id }).lean().exec();
  return Viewpoint.findOne({ viewpointId: id }).lean().exec();
}

const router = Router();
router.use(authenticateToken);
router.get('/:language/:kind/:id', managedRolePermission('Languages & Localization', 'Read', authorizeRole.adminOnly),
  Validator.params(params), async (req, res) => {
  const target = req.validatedParams as Target;
  const doc = await readTarget(target);
  if (!doc) throw new NotFoundError('Tour content not found.');
  const translations = 'translations' in doc ? doc.translations :
    'localizedText' in doc ? doc.localizedText : undefined;
  const translation = translations instanceof Map
    ? translations.get(target.language)
    : translations?.[target.language];
  ResponseHandler.send(res, 200, { data: translation ?? null });
});

router.put('/:language/:kind/:id', managedRolePermission('Languages & Localization', 'Update', authorizeRole.adminOnly),
  Validator.params(params), Validator.body(text), async (req, res) => {
  const target = req.validatedParams as Target;
  const { language, kind, id } = target;
  if (language === 'en') throw new BadRequestError('Edit English in the main content form.');
  if (!(await Language.exists({ code: language }))) throw new NotFoundError('Language not found.');
  const value = req.validatedBody as z.infer<typeof text>;
  const updated = kind === 'floor'
    ? await Floor.updateOne({ floorId: id }, { $set: { [`localizedText.${language}`]: { title: value.title } } })
    : kind === 'landmark'
      ? await Landmark.updateOne({ code: id }, { $set: { [`localizedText.${language}`]: value } })
      : await Viewpoint.updateOne({ viewpointId: id }, { $set: {
          [`translations.${language}.title`]: value.title,
          [`translations.${language}.description`]: value.description,
        } });
  if (!updated.matchedCount) throw new NotFoundError('Tour content not found.');
  await bumpTourManifest();
  await Promise.all([
    clearCachePattern('sync:*'),
    clearCachePattern('viewpoint:*'),
    clearCachePattern('viewpoints:*'),
  ]);
  ResponseHandler.send(res, 200, { data: value });
});

export default router;
