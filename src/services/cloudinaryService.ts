import { type UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '@config/cloudinary.js';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  folder: string;
}

export default class CloudinaryService {
  /**
   * Uploads an in-memory buffer to Cloudinary within a dynamic nested folder under the 'colosseum/' root.
   *
   * @param buffer - File byte buffer from Multer memory storage
   * @param subFolderPath - Relative folder path (e.g. 'landmarks/arch_of_constantine/overlays')
   * @param originalFileName - Optional original filename to preserve/override
   */
  async UploadBufferStream(
    buffer: Buffer,
    subFolderPath: string,
    originalFileName?: string
  ): Promise<CloudinaryUploadResult> {
    if (!isCloudinaryConfigured) {
      throw new Error(
        'Cloudinary credentials are not configured in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
      );
    }

    // Clean folder path and ensure it's rooted under 'colosseum/'
    const cleanedSubPath = subFolderPath.replace(/^\/+|\/+$/g, '');
    const targetFolder = cleanedSubPath.startsWith('colosseum')
      ? cleanedSubPath
      : `colosseum/${cleanedSubPath}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          filename_override: originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') : undefined,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary returned an empty response'));
          }

          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type,
            folder: targetFolder,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Deletes a specific asset from Cloudinary by its public ID.
   */
  async DeleteAsset(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<any> {
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary credentials are not configured.');
    }
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (res?.result === 'not found' && resourceType === 'image') {
      // Try raw in case it was classified as raw
      try {
        return await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch {
        return res;
      }
    }
    return res;
  }

  /**
   * Deletes an entire directory in Cloudinary (must be empty of assets first or use prefix deletion).
   */
  async DeleteFolder(folderPath: string): Promise<any> {
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary credentials are not configured.');
    }
    const cleanedPath = folderPath.replace(/^\/+|\/+$/g, '');
    const fullFolder = cleanedPath.startsWith('colosseum')
      ? cleanedPath
      : `colosseum/${cleanedPath}`;
    return cloudinary.api.delete_folder(fullFolder);
  }
}
