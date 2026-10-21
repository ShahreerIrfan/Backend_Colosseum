import { connectDB, disconnectDB } from '../config/db.js';
import mongoose from 'mongoose';

async function verify() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection not established');
    process.exit(1);
  }
  const collections = await db.listCollections().toArray();
  console.log('====================================================');
  console.log('       COLOSSEUM LIVE MONGODB COLLECTIONS           ');
  console.log('====================================================');
  for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    const sample = await db.collection(c.name).findOne({});
    let sampleSummary = '';
    if (sample) {
      if (sample.name) sampleSummary = `(sample: "${sample.name}")`;
      else if (sample.floorId) sampleSummary = `(sample floorId: "${sample.floorId}")`;
      else if (sample.routeId) sampleSummary = `(sample routeId: "${sample.routeId}")`;
      else if (sample.code) sampleSummary = `(sample code: "${sample.code}")`;
      else if (sample.configKey) sampleSummary = `(sample configKey: "${sample.configKey}")`;
      else if (sample.token) sampleSummary = `(sample token: "${sample.token}")`;
      else if (sample.email) sampleSummary = `(sample email: "${sample.email}")`;
      else if (sample.packageVersion) sampleSummary = `(sample version: "v${sample.packageVersion}")`;
    }
    console.log(`• ${c.name.padEnd(22)} : ${count.toString().padStart(3)} documents ${sampleSummary}`);
  }
  console.log('====================================================');
  await disconnectDB();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
