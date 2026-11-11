import { afterEach, expect, it, vi } from 'vitest';
import type { Query } from 'mongoose';
import { Floor } from '../../models/Floor.js';
import FloorRepository from '@repositories/floorRepository.js';

afterEach(() => vi.restoreAllMocks());

it('casts floor slugs safely for reads, updates and deletes', async () => {
  const exec = vi.spyOn(Floor.Query.prototype, 'exec').mockImplementation(async function (
    this: Query<unknown, unknown>
  ) {
    this.cast(Floor);
    expect(this.getFilter()).toEqual({ floorId: 'ludus_shaeakhs_floor' });
    return null;
  });
  const repository = new FloorRepository();
  expect(await repository.GetByID('ludus_shaeakhs_floor')).toBeNull();
  expect(await repository.Update('ludus_shaeakhs_floor', { isPublished: true })).toBeNull();
  expect(await repository.Remove('ludus_shaeakhs_floor')).toBe(false);
  expect(exec).toHaveBeenCalledTimes(3);
});
