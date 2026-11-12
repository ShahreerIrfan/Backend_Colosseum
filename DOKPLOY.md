# Dokploy Deployment Guide (Docker Build)

## 1. Create Application in Dokploy
- **Provider**: GitHub (`ShahreerIrfan/Backend_Colosseum`)
- **Branch**: `main`
- **Build Type**: **Dockerfile**
  - **Docker File**: `Dockerfile`
  - **Docker Context Path**: `.`
  - **Docker Build Stage**: leave empty (uses final `runner` stage)

## 2. Domain & Port Settings
- **Container Port**: `3000` (must match `PORT` env variable)
- **Health Check Path**: `/api/v1/health`

## 3. Database & Cache Services
In Dokploy, provision a **MongoDB** database service (or use MongoDB Atlas) before starting the backend:
- Copy the internal Dokploy MongoDB connection string (or Atlas SRV URI) into `MONGODB_URI`.
- **Redis** is optional: if you provision a Dokploy Redis service, set `REDIS_URL`; otherwise the backend automatically runs with cache bypass.

## 4. Environment Variables (Dokploy -> Environment Tab)
Minimum required / recommended variables:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=https://your-admin-domain.com
MONGODB_URI=mongodb://<user>:<password>@<dokploy-mongo-service>:27017/colosseum_db?authSource=admin
MONGODB_DB_NAME=colosseum_db
JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_DEFAULT_NAME=Super Administrator
ADMIN_DEFAULT_EMAIL=admin@colosseumtour.it
ADMIN_DEFAULT_PASSWORD=<strong-password>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
TOUR_CONTENT_VERSION=1.0.0
```

## 5. First Boot Notes
- On first startup against an empty MongoDB database, `autoSeedIfEmpty()` automatically seeds landmarks, floors, viewpoints, itineraries, languages, translations, demo tickets, and default admin/moderator accounts.
- Compiled production entrypoint is `node dist/index.js` running as the non-root `node` user.

