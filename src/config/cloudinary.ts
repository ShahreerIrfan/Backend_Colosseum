import { v2 as cloudinary } from 'cloudinary';
import { EnvConstant } from '@constants/allConstant.js';

const isCloudinaryConfigured: boolean = Boolean(
  EnvConstant.CLOUDINARY_CLOUD_NAME &&
    EnvConstant.CLOUDINARY_API_KEY &&
    EnvConstant.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: EnvConstant.CLOUDINARY_CLOUD_NAME,
    api_key: EnvConstant.CLOUDINARY_API_KEY,
    api_secret: EnvConstant.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary, isCloudinaryConfigured };
