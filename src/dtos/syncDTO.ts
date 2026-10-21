import { z } from 'zod';

export const BundleQuerySchema = z.object({
  lang: z.string().optional().default('en'),
  language: z.string().optional(),
});

export const FloorParamSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
});

export const TourSyncManifestSchema = z.object({
  packageVersion: z.string(),
  contentHash: z.string(),
  publishedAt: z.coerce.date().or(z.string()),
  totalFloors: z.number().int(),
  totalViewpoints: z.number().int(),
  totalLandmarks: z.number().int(),
  supportedLanguages: z.array(z.string()),
  isCurrent: z.boolean().default(true),
});

export type BundleQuery = z.infer<typeof BundleQuerySchema>;
export type FloorParam = z.infer<typeof FloorParamSchema>;
export type TourSyncManifest = z.infer<typeof TourSyncManifestSchema>;
