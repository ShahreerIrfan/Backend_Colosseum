import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '@config/db.js';
import { EnvConstant } from '@constants/allConstant.js';
import { loadVisitorTranslations, syncVisitorTranslations } from './visitorTranslations.js';
import {
  Floor,
  Viewpoint,
  ItinerarySegment,
  Landmark,
  Language,
  Ticket,
  TourSyncManifest,
  PedestrianRoute,
  User,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SeedOptions {
  disconnectOnComplete?: boolean;
  shouldConnect?: boolean;
}

export const seedDatabase = async ({
  disconnectOnComplete = true,
  shouldConnect = true,
}: SeedOptions = {}): Promise<void> => {
  console.log('🌱 Starting MongoDB database seeding with Master Dataset...');
  if (shouldConnect) {
    await connectDB();
  }

  const possibleSeedPaths = [
    path.join(__dirname, '../data/seed/master_colosseum_seed.json'),
    path.join(__dirname, '../../src/data/seed/master_colosseum_seed.json'),
    path.resolve(process.cwd(), 'src/data/seed/master_colosseum_seed.json'),
    path.join(__dirname, '../data/seed/colosseum_mvp_seed.json'),
  ];

  let seedFilePath = '';
  for (const candidate of possibleSeedPaths) {
    if (fs.existsSync(candidate)) {
      seedFilePath = candidate;
      break;
    }
  }

  if (!seedFilePath) {
    throw new Error(`Seed file not found. Checked: ${possibleSeedPaths.join(', ')}`);
  }

  console.log(`📖 Loading seed data from: ${seedFilePath}`);
  const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
  const visitorTranslations = await loadVisitorTranslations();

  // 1. Clear existing collections
  console.log('🧹 Purging existing collections...');
  await Promise.all([
    Floor.deleteMany({}),
    Viewpoint.deleteMany({}),
    ItinerarySegment.deleteMany({}),
    Landmark.deleteMany({}),
    Language.deleteMany({}),
    Ticket.deleteMany({}),
    TourSyncManifest.deleteMany({}),
    PedestrianRoute.deleteMany({}),
    User.deleteMany({ email: { $in: ['admin@colosseumtour.it', 'curator@colosseumtour.it'] } }),
  ]);

  // 2. Insert Landmarks
  console.log(`🏛️ Seeding ${seedData.landmarks.length} landmarks with marker pin configurations...`);
  const landmarkDocs = seedData.landmarks.map((lm: any) => ({
    code: lm.code,
    name: lm.name,
    description: lm.description || lm.name,
    assetPath: lm.assetPath,
    location: {
      type: 'Point',
      coordinates: [lm.center.longitude, lm.center.latitude],
    },
    dimensions: lm.dimensions,
    calibration: lm.calibration,
    display: lm.display,
    marker: lm.marker || {
      colorHex: '#C68642',
      category: 'monument',
      iconName: 'monument',
      labelOffsetY: 0,
    },
    isPublished: true,
  }));
  await Landmark.insertMany(landmarkDocs);

  // 3. Insert Floors
  console.log(`🏢 Seeding ${seedData.floors.length} floors across 5 monumental sites...`);
  await Floor.insertMany(seedData.floors);

  // 4. Insert Viewpoints
  console.log(`📍 Seeding ${seedData.viewpoints.length} viewpoints with audio tour metadata...`);
  const viewpointDocs = seedData.viewpoints.map((vp: any) => ({
    viewpointId: vp.id,
    floorId: vp.floorId,
    order: vp.order,
    canvasCoordinates: {
      normalizedX: vp.normalizedX,
      normalizedY: vp.normalizedY,
    },
    location: {
      type: 'Point',
      coordinates: [vp.longitude, vp.latitude],
    },
    navigation: {
      triggerRadiusMeters: vp.triggerRadiusMeters || 4.0,
      targetGazeHeadingDegrees: vp.targetGazeHeadingDegrees ?? null,
    },
    translations: {
      en: {
        title: vp.title,
        description: vp.description,
      },
    },
    image: {
      url: vp.imageAsset,
      assetName: vp.imageAsset,
    },
    minimumTierRequired: vp.minimumTierRequired || 'general',
    isPublished: true,
  }));
  await Viewpoint.insertMany(viewpointDocs);

  // 5. Insert Itinerary Segments
  console.log(`🗺️ Seeding ${seedData.itineraries.length} walking itinerary pathways...`);
  await ItinerarySegment.insertMany(seedData.itineraries);

  // 6. Insert Pedestrian Routes
  if (seedData.pedestrianRoutes?.length) {
    console.log(`🚶 Seeding ${seedData.pedestrianRoutes.length} outdoor pedestrian street routes...`);
    await PedestrianRoute.insertMany(seedData.pedestrianRoutes);
  }

  // 8. Insert Languages
  console.log(`🌐 Seeding ${seedData.languages.length} supported languages...`);
  await Language.insertMany(seedData.languages);
  const translations = await syncVisitorTranslations(visitorTranslations, { apply: true });
  console.log(`🌐 Added ${translations.written} translations for matching tour content.`);

  // 9. Insert Tickets
  console.log(`🎟️ Seeding ${seedData.tickets.length} demo access tickets...`);
  await Ticket.insertMany(seedData.tickets);

  // 10. Seed Staff Users (Super Admin & Moderator)
  console.log(`👤 Seeding default staff accounts for CMS authentication...`);
  const passwordHash = await bcrypt.hash('ChangeMeColosseum2026!', 10);
  await User.create([
    {
      name: 'Super Administrator',
      email: EnvConstant.ADMIN_DEFAULT_EMAIL || 'admin@colosseumtour.it',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      assignedFloorIds: [],
      is_active: true,
    },
    {
      name: 'Content Moderator',
      email: 'moderator@colosseumtour.it',
      password: passwordHash,
      role: 'MODERATOR',
      assignedFloorIds: ['floor_underground', 'floor_1'],
      is_active: true,
    },
  ]);

  // 11. Create Initial TourSyncManifest
  const contentHash = crypto.createHash('sha256')
    .update(JSON.stringify({ seedData, visitorTranslations })).digest('hex');

  const manifest = {
    packageVersion: '1.0.0',
    contentHash,
    publishedAt: new Date(),
    totalFloors: seedData.floors.length,
    totalViewpoints: seedData.viewpoints.length,
    totalLandmarks: seedData.landmarks.length,
    supportedLanguages: seedData.languages.map((l: any) => l.code),
    isCurrent: true,
  };
  await TourSyncManifest.create(manifest);

  console.log('✅ MongoDB database master seeding completed successfully!');
  console.log(`   - 🏛️ Landmarks: ${landmarkDocs.length}`);
  console.log(`   - 🏢 Floors: ${seedData.floors.length}`);
  console.log(`   - 📍 Viewpoints: ${viewpointDocs.length}`);
  console.log(`   - 🗺️ Itinerary Segments: ${seedData.itineraries.length}`);
  console.log(`   - 🚶 Pedestrian Routes: ${seedData.pedestrianRoutes?.length || 0}`);
  console.log(`   - 🌐 Languages: ${seedData.languages.length}`);
  console.log(`   - 🎟️ Tickets: ${seedData.tickets.length}`);
  console.log(`   - 👤 Staff Users: 2`);
  console.log(
    `   - 📦 Sync Manifest: v${manifest.packageVersion} (${contentHash.substring(0, 10)}...)`
  );

  if (disconnectOnComplete) {
    await disconnectDB();
  }
};

export const autoSeedIfEmpty = async (): Promise<void> => {
  const floorCount = await Floor.countDocuments();
  if (floorCount === 0) {
    console.log('🌱 Database is empty. Running initial auto-seed...');
    await seedDatabase({ disconnectOnComplete: false, shouldConnect: false });
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
