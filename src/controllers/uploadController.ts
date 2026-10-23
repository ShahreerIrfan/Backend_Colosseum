import type { Request, Response } from 'express';
import CloudinaryService from '@services/cloudinaryService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { HttpConstants } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;

export default class UploadController {
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.cloudinaryService = new CloudinaryService();
  }

  /**
   * Handles dynamic file uploads with flexible nested folder paths.
   * Path resolution order:
   * 1. URL params: /api/v1/uploads/:section/:slug?/:subSection?
   * 2. Query param: ?folder=landmarks/arch_of_constantine/overlays
   * 3. Fallback: 'general'
   */
  UploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        ResponseHandler.send(res, HttpStatus.BAD_REQUEST.code, {
          message: 'No file was provided in the upload request.',
        });
        return;
      }

      // Determine dynamic folder hierarchy
      const { section, slug, subSection } = req.params;
      const queryFolder = req.query.folder as string | undefined;

      let folderPath: string;
      if (section) {
        const parts = [section, slug, subSection].filter(Boolean);
        folderPath = parts.join('/');
      } else if (queryFolder) {
        folderPath = queryFolder;
      } else {
        folderPath = 'general';
      }

      const result = await this.cloudinaryService.UploadBufferStream(
        file.buffer,
        folderPath,
        file.originalname
      );

      ResponseHandler.send(res, HttpStatus.CREATED.code, {
        data: result,
        message: 'File successfully uploaded to Cloudinary.',
      });
    } catch (error: any) {
      ResponseHandler.send(res, HttpStatus.INTERNAL_SERVER_ERROR.code, {
        message: error.message || 'File upload failed.',
      });
    }
  };

  /**
   * Deletes an asset by public ID.
   */
  DeleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { publicId, resourceType } = req.body;
      if (!publicId) {
        ResponseHandler.send(res, HttpStatus.BAD_REQUEST.code, {
          message: 'publicId is required to delete an asset.',
        });
        return;
      }

      const result = await this.cloudinaryService.DeleteAsset(publicId, resourceType || 'image');
      ResponseHandler.send(res, HttpStatus.OK.code, {
        data: result,
        message: 'Asset successfully deleted.',
      });
    } catch (error: any) {
      ResponseHandler.send(res, HttpStatus.INTERNAL_SERVER_ERROR.code, {
        message: error.message || 'Asset deletion failed.',
      });
    }
  };
}
