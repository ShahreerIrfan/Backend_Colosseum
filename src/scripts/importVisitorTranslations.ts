import { connectDB, disconnectDB } from '@config/db.js';
import redisClient, { connectRedis } from '@config/redis.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { bumpTourManifest } from '@utils/tourManifest.js';
import { loadVisitorTranslations, syncVisitorTranslations } from './visitorTranslations.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--apply')) {
    throw new Error('Usage: npm run db:seed-translations [-- --apply]');
  }
  const apply = args[0] === '--apply';
  const translations = await loadVisitorTranslations();
  let wrote = false;
  try {
    await connectDB();
    const report = await syncVisitorTranslations(translations, { apply, onWrite: () => { wrote = true; } });
    console.log(apply ? 'Translation import' : 'Translation dry run', report);
  } finally {
    try {
      if (wrote) {
        if (!(await bumpTourManifest())) {
          console.warn('Translations were saved. Create a current tour manifest to notify downloaded clients.');
        }
        await connectRedis();
        await Promise.all(['sync:*', 'viewpoint:*', 'viewpoints:*'].map(clearCachePattern));
      }
    } finally {
      if (redisClient.isOpen) await redisClient.close();
      await disconnectDB();
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
