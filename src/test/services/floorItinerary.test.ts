import { expect, it } from 'vitest';
import { createSegment, updateSegment } from '@dtos/floorItineraryDTO.js';
import { can } from '@services/managedRoles.js';
import { getRoleRbac } from '@constants/rbacConstants.js';
import type { AuthPayload } from '@dtos/authDTO.js';

it('keeps existing path metadata on a publication-only update', () => {
  expect(updateSegment.parse({ isPublished: true })).toEqual({ isPublished: true });
  expect(createSegment.safeParse({ fromId: 'a', toId: 'b', waypoints: [], isPublished: true }).success)
    .toBe(false);
});

it('rejects invalid geographic waypoints', () => {
  expect(updateSegment.safeParse({ waypoints: [{ latitude: 91, longitude: 12 }] }).success)
    .toBe(false);
});

it('requires separate permission for creating and publishing a connection', () => {
  const admin = { rback: getRoleRbac('ADMIN') } as AuthPayload;
  const reader = {
    rback: [{ 'module name': 'Floor Itinerary', Create: 'false', Read: 'true', Update: 'false', Delete: 'false' }],
  } as AuthPayload;
  expect(can(admin, 'Floor Itinerary', 'Create')).toBe(true);
  expect(can(admin, 'Floor Itinerary', 'Update')).toBe(true);
  expect(can(reader, 'Floor Itinerary', 'Read')).toBe(true);
  expect(can(reader, 'Floor Itinerary', 'Update')).toBe(false);
});
