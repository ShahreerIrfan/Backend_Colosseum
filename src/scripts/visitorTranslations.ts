import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { Floor } from '../models/Floor.js';
import { Landmark } from '../models/Landmark.js';
import { Language } from '../models/Language.js';
import { Viewpoint } from '../models/Viewpoint.js';

const localized = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(12000).optional(),
});
const entriesSchema = z.array(z.object({
  kind: z.enum(['landmark', 'floor', 'viewpoint']),
  id: z.string().min(1),
  source: localized,
  translations: z.partialRecord(z.enum(['it', 'es', 'fr', 'de', 'pt', 'ja', 'ko']), localized),
}));

export async function loadVisitorTranslations() {
  const file = new URL('../data/seed/visitor_translations.json', import.meta.url);
  return entriesSchema.parse(JSON.parse(await readFile(file, 'utf8')));
}

export async function syncVisitorTranslations(
  entries: Awaited<ReturnType<typeof loadVisitorTranslations>>,
  { apply, onWrite }: { apply: boolean; onWrite?: () => void },
) {
  const catalog = new Set(await Language.distinct('code'));
  const report = { eligible: 0, written: 0, kept: 0, unmatchedContent: 0, missingLanguages: 0 };
  for (const entry of entries) {
    const { kind, id, source } = entry;
    const collection = kind === 'floor' ? Floor.collection
      : kind === 'landmark' ? Landmark.collection : Viewpoint.collection;
    const original = kind === 'floor' ? { floorId: id, displayName: source.title }
      : kind === 'landmark' ? { code: id, name: source.title, description: source.description }
      : { viewpointId: id, 'translations.en.title': source.title, 'translations.en.description': source.description };
    if (!(await collection.findOne(original, { projection: { _id: 1 } }))) {
      report.unmatchedContent++;
      continue;
    }
    for (const [language, text] of Object.entries(entry.translations)) {
      if (!catalog.has(language)) {
        report.missingLanguages++;
        continue;
      }
      const field = kind === 'viewpoint' ? `translations.${language}` : `localizedText.${language}`;
      const filter = { ...original, [field]: { $exists: false } };
      if (apply) {
        const value = kind === 'viewpoint' ? { ...text, description: text.description ?? text.title } : text;
        const result = await collection.updateOne(filter, {
          $set: { [field]: value },
          $currentDate: { updatedAt: true },
        });
        if (result.modifiedCount) {
          report.written++;
          onWrite?.();
        } else {
          report.kept++;
        }
      } else if (await collection.findOne(filter, { projection: { _id: 1 } })) {
        report.eligible++;
      } else {
        report.kept++;
      }
    }
  }
  return report;
}
