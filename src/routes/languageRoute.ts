import { Router } from 'express';
import { z } from 'zod';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import { managedRolePermission } from '@middlewares/requirePermission.js';
import { Validator } from '@middlewares/requestValidator.js';
import { BadRequestError, ConflictError, NotFoundError } from '@errors/concreteErrors.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import ResponseHandler from '@utils/responseHandler.js';
import { Language } from '../models/Language.js';

const code = z.string().trim().regex(/^[a-z]{2,3}(-[a-zA-Z0-9]{2,8})*$/);
const fields = z.object({
  name: z.string().trim().min(1).max(100),
  nativeName: z.string().trim().min(1).max(100),
  ttsLocale: z.string().trim().regex(/^[a-z]{2,3}(-[a-zA-Z0-9]{2,8})*$/),
  isAvailable: z.boolean(),
  displayOrder: z.number().int().min(0).max(999),
});

const router = Router();
function validateTtsLocale(languageCode: string, locale?: string) {
  if (locale && languageCode.split('-')[0] !== locale.split('-')[0]) {
    throw new BadRequestError('The TTS locale must use the same base language as the catalog entry.');
  }
}
router.get('/catalog', async (_req, res) => {
  const languages = await Language.find().sort({ displayOrder: 1, code: 1 }).lean().exec();
  ResponseHandler.send(res, 200, { data: languages });
});
router.post('/', authenticateToken, managedRolePermission('Languages & Localization', 'Create', authorizeRole.adminOnly),
  Validator.body(fields.extend({ code })), async (req, res) => {
    validateTtsLocale(req.validatedBody.code, req.validatedBody.ttsLocale);
    if (await Language.exists({ code: req.validatedBody.code })) {
      throw new ConflictError('A language with this code already exists.');
    }
    const created = await Language.create({ ...req.validatedBody, isDefault: false });
    await clearCachePattern('sync:languages:*');
    ResponseHandler.send(res, 201, { data: created });
  });
router.patch('/:code', authenticateToken, managedRolePermission('Languages & Localization', 'Update', authorizeRole.hasRole('ADMIN', 'SUPER_ADMIN', 'MODERATOR')),
  Validator.params(z.object({ code })), Validator.body(fields.partial()), async (req, res) => {
    const languageCode = req.validatedParams.code;
    validateTtsLocale(languageCode, req.validatedBody.ttsLocale);
    if (languageCode === 'en' && req.validatedBody.isAvailable === false) {
      throw new BadRequestError('Keep English enabled as the fallback language.');
    }
    const saved = await Language.findOneAndUpdate(
      { code: languageCode }, { $set: req.validatedBody }, { new: true, runValidators: true },
    ).lean().exec();
    if (!saved) throw new NotFoundError('Language not found.');
    await clearCachePattern('sync:languages:*');
    ResponseHandler.send(res, 200, { data: saved });
  });
router.delete('/:code', authenticateToken, managedRolePermission('Languages & Localization', 'Delete', authorizeRole.adminOnly),
  Validator.params(z.object({ code })), async (req, res) => {
    const languageCode = req.validatedParams.code;
    if (languageCode === 'en') throw new BadRequestError('The fallback language cannot be deleted.');
    const result = await Language.deleteOne({ code: languageCode }).exec();
    if (!result.deletedCount) throw new NotFoundError('Language not found.');
    await clearCachePattern('sync:languages:*');
    ResponseHandler.send(res, 200, { message: 'Language deleted from the catalog.' });
  });

export default router;
