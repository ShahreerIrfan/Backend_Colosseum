import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViewpointService from '@services/viewpointService.js';
import { UpdateViewpointSchema } from '@dtos/viewpointDTO.js';
import type { AuthPayload } from '@dtos/authDTO.js';
import { Floor } from '../../models/Floor.js';
import { ItinerarySegment } from '../../models/ItinerarySegment.js';

const repository = vi.hoisted(() => ({ GetByID: vi.fn(), Update: vi.fn() }));
vi.mock('@repositories/viewpointRepository.js', () => ({
  default: class {
    GetByID = repository.GetByID;
    Update = repository.Update;
  },
}));
vi.mock('../../models/Floor.js', () => ({ Floor: { exists: vi.fn() } }));
vi.mock('../../models/ItinerarySegment.js', () => ({
  ItinerarySegment: { exists: vi.fn() },
}));

const moderator: AuthPayload = {
  id: 'moderator', name: 'Moderator', email: 'moderator@example.com',
  role: 'MODERATOR', assignedFloorIds: ['floor_a', 'floor_b'],
};

describe('Viewpoint floor reassignment', () => {
  const service = new ViewpointService();
  const move = { floorId: 'floor_b' };

  beforeEach(() => {
    vi.resetAllMocks();
    repository.GetByID.mockResolvedValue({ id: 'vp', floorId: 'floor_a' });
    repository.Update.mockResolvedValue({ id: 'vp', floorId: 'floor_b' });
    vi.mocked(Floor.exists).mockResolvedValue({ _id: 'floor_b' } as never);
  });

  it('passes only the requested changes and conditions the write on the original floor', async () => {
    const patch = UpdateViewpointSchema.parse(move);
    expect(patch).toEqual(move);
    await expect(service.UpdateViewpoint('vp', patch, moderator)).resolves.toMatchObject(move);
    expect(repository.Update).toHaveBeenCalledWith('vp', move, 'floor_a');
  });

  it('rejects editing a viewpoint on an unassigned source floor', async () => {
    await expect(service.UpdateViewpoint('vp', move, {
      ...moderator, assignedFloorIds: ['floor_b'],
    })).rejects.toThrow('access to both Floors');
    expect(repository.Update).not.toHaveBeenCalled();
  });

  it('rejects moving a viewpoint referenced by its itinerary', async () => {
    vi.mocked(ItinerarySegment.exists).mockResolvedValue({ _id: 'segment' } as never);
    await expect(service.UpdateViewpoint('vp', move, moderator))
      .rejects.toThrow('current itinerary');
    expect(repository.Update).not.toHaveBeenCalled();
  });
});
