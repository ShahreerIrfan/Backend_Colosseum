import express, { Router } from 'express';
import multer from 'multer';
import UploadController from '@controllers/uploadController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (sufficient for high-res SVGs, images, and audio tracks)
  },
});

const router: Router = express.Router();
const controller = new UploadController();

// Multi-segment dynamic route paths:
// POST /api/v1/uploads/landmarks/arch_of_constantine/overlays
router.post('/:section/:slug/:subSection', upload.single('file'), controller.UploadFile);

// POST /api/v1/uploads/landmarks/arch_of_constantine
router.post('/:section/:slug', upload.single('file'), controller.UploadFile);

// POST /api/v1/uploads/landmarks
router.post('/:section', upload.single('file'), controller.UploadFile);

// Base upload: POST /api/v1/uploads?folder=custom/path
router.post('/', upload.single('file'), controller.UploadFile);

// Asset deletion: DELETE /api/v1/uploads
router.delete('/', controller.DeleteFile);

export default router;
