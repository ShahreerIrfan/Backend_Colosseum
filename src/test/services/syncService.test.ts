import { afterEach, expect, it, vi } from 'vitest';
import SyncRepository from '@repositories/syncRepository.js';
import SyncService from '@services/syncService.js';

afterEach(() => vi.restoreAllMocks());

it('rebuilds a bundle after a revision change and excludes deleted landmarks and their dependents', async () => {
  const manifest = (contentHash: string) => ({
    packageVersion: '1.0.0', contentHash, publishedAt: new Date(),
    totalFloors: 1, totalViewpoints: 0, totalLandmarks: 1, supportedLanguages: ['en'], isCurrent: true,
  });
  const repository = SyncRepository.prototype;
  vi.spyOn(repository, 'GetCurrentManifest')
    .mockResolvedValueOnce(manifest('old'))
    .mockResolvedValue(manifest('new'));
  const landmarks = vi.spyOn(repository, 'GetActiveLandmarks')
    .mockResolvedValueOnce([{ id: 'removed' }, { id: 'remaining' }])
    .mockResolvedValue([{ id: 'remaining' }]);
  vi.spyOn(repository, 'GetAllFloors').mockResolvedValue([
    { floorId: 'removed-floor', landmarkCode: 'removed' },
    { floorId: 'remaining-floor', landmarkCode: 'remaining' },
  ]);
  vi.spyOn(repository, 'GetViewpointsByFloor').mockResolvedValue([]);
  vi.spyOn(repository, 'GetItinerariesByFloor').mockResolvedValue([]);

  const bundle = await new SyncService().GetOfflineTourBundle();
  expect(landmarks).toHaveBeenCalledTimes(2);
  expect(bundle.manifest.contentHash).toBe('new');
  expect(bundle.landmarks.map((landmark: { id: string }) => landmark.id)).toEqual(['remaining']);
  expect(bundle.floors.map((floor: { id: string }) => floor.id)).toEqual(['remaining-floor']);
  expect(bundle.pedestrianRoutes).toEqual([]);
});
