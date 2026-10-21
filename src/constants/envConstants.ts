import dotenv from 'dotenv';

dotenv.config();

const EnvConstant = {
  PORT: parseInt(process.env.PORT || '3000', 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/colosseum_db',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'colosseum_db',
  MONGODB_MIN_POOL_SIZE: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10) || 5,
  MONGODB_MAX_POOL_SIZE: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '20', 10) || 20,

  // Redis Cache
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_colosseum_2026_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_DEFAULT_EMAIL: process.env.ADMIN_DEFAULT_EMAIL || 'admin@colosseumtour.it',
  ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMeColosseum2026!',

  // Cloudinary & Storage
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',
  MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER || 'cloudinary',
  LOCAL_ASSET_BASE_URL: process.env.LOCAL_ASSET_BASE_URL || 'http://localhost:3000/assets',

  // Versioning
  TOUR_CONTENT_VERSION: process.env.TOUR_CONTENT_VERSION || '1.0.0',
};

export default EnvConstant;
