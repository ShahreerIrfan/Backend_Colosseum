# Colosseum Backend API (TypeScript)

Type-safe, modern Node.js / Express / TypeScript / MongoDB backend service for the **Colosseum Audio Tour Guide** project.

## Features

- **100% TypeScript with Modern Node.js ESM (`"type": "module"`)**
- **Strongly Typed Domain Models & DTOs**: Full compile-time type safety for coordinates, geometry, overlays, viewpoints, and manifests.
- **MongoDB & Mongoose ODM**: Fully relational schema design with GeoJSON `2dsphere` spatial indexing.
- **Generic Repository Design Pattern**: Strict abstraction of database queries using a generic `BaseRepository<T>`.
- **Auto-Seeding**: Automatic initial database seeding on clean boot with 28 authentic viewpoints, 4 monument floors, 24 itineraries, 5 archaeological landmarks, and 8 languages.
- **Docker & Docker Compose**: Multi-stage container definition with Node.js 24 Alpine and MongoDB 7.0 healthchecks.
- **Media CDN Ready**: Cloudinary media storage with local asset fallback.
- **Code Quality & Formatting**: TypeScript-ESLint + Prettier.
- **Native Test Runner (`node:test` via `tsx`)** with 13 automated integration tests.

---

## Directory Structure

```
ColosseumBackend/
├── .dockerignore           # Docker build ignore rules
├── .env                    # Local environment configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── .prettierrc             # Prettier configuration
├── .prettierignore         # Prettier ignore list
├── deploy.sh               # VPS deployment script wrapper
├── deploy.py               # Automated VPS deployment script
├── Dockerfile              # Multi-stage container build (node:24-alpine)
├── docker-compose.yml      # Multi-container orchestration (Backend + MongoDB)
├── eslint.config.js        # ESLint flat config with TypeScript parser
├── package.json            # Node package definition & scripts
├── tsconfig.json           # TypeScript compiler configuration
├── README.md               # Project documentation
├── src/
│   ├── app.ts              # Express application setup
│   ├── server.ts           # HTTP server entry point with auto-seeding
│   ├── config/
│   │   ├── cloudinary.ts   # Cloudinary SDK config
│   │   ├── database.ts     # Mongoose MongoDB connection
│   │   └── environment.ts  # Typed environment configuration
│   ├── controllers/        # REST API Controllers
│   ├── data/
│   │   └── seed/           # Authentic Colosseum seed JSON
│   ├── middleware/         # Express Request Logger & Error Handlers
│   ├── models/             # Mongoose Data Models
│   ├── repositories/       # Generic Base Repository & Model Repositories
│   ├── routes/             # Express Routers
│   ├── scripts/            # Database Seeding & Extraction
│   ├── services/           # Domain Business Services
│   └── types/              # Domain interfaces and DTO definitions
└── test/
    └── api.test.ts         # Integration test suite (13 automated tests)
```

---

## Getting Started

### Local Development (without Docker)

```bash
cd project/ColosseumBackend
npm install
npm run db:seed    # Seeds MongoDB with 28 viewpoints, 4 floors, 5 landmarks
npm run dev        # Starts development server with hot-reload (tsx watch)
```

### Build for Production

```bash
npm run build      # Compiles TypeScript (src/) into JavaScript (dist/)
npm start          # Runs compiled server (node dist/server.js)
```

### Docker & Docker Compose

Run the full stack (TypeScript Node.js Backend + MongoDB) in Docker:

```bash
# Build and start both containers
docker compose up -d --build

# View container status & logs
docker compose ps
docker compose logs backend -f

# Stop containers
docker compose down
```

---

## VPS Deployment

To deploy to the remote VPS (`165.99.219.254`):

```bash
npm run deploy
# or
./deploy.sh
```

---

## Available Scripts

| Command                | Action                                                               |
| :--------------------- | :------------------------------------------------------------------- |
| `npm run dev`          | Runs the server in development mode with auto-reload (`tsx watch`)   |
| `npm run build`        | Compiles TypeScript code to `dist/` directory (`tsc`)                |
| `npm start`            | Runs the compiled production server (`node dist/server.js`)          |
| `npm run db:seed`      | Seeds local/remote MongoDB with 28 viewpoints, 4 floors, 5 landmarks |
| `npm test`             | Runs the automated integration test suite (`tsx --test`)             |
| `npm run lint`         | Runs ESLint with TypeScript linting rules                            |
| `npm run lint:fix`     | Runs ESLint and automatically fixes fixable issues                   |
| `npm run format`       | Formats all code using Prettier                                      |
| `npm run format:check` | Verifies code formatting with Prettier                               |

---

## API Endpoints

- **`GET /api/v1/health`**: Health status check.
- **`GET /api/v1/sync/manifest`**: Package version & checksum for offline delta sync.
- **`GET /api/v1/tours/bundle?lang=en`**: Complete offline tour package in one network roundtrip.
- **`GET /api/v1/floors`**: List of monument floors.
- **`GET /api/v1/floors/:floorId`**: Floor details with viewpoints and itineraries.
- **`GET /api/v1/landmarks`**: 5 calibrated archaeological ground overlays.
- **`GET /api/v1/languages`**: 8 supported tour languages.
- **`POST /api/v1/tickets/validate`**: Physical voucher ticket token validation.
