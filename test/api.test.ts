import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import app from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

test('Colosseum Backend MongoDB & API Integration Tests (TypeScript)', async (t) => {
  let server: Server;
  const testPort = 3098;
  const baseUrl = `http://localhost:${testPort}`;

  await t.test('connect to MongoDB and start test server', async () => {
    await connectDB();
    await new Promise<void>((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
  });

  await t.test('GET / returns 200 with service information', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.status, 'running');
  });

  await t.test('GET /api/v1/health returns 200 ok', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.status, 'ok');
  });

  await t.test('GET /api/v1/sync/manifest returns package manifest', async () => {
    const res = await fetch(`${baseUrl}/api/v1/sync/manifest`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.packageVersion, '1.0.0');
    assert.equal(data.data.totalFloors, 12);
    assert.equal(data.data.totalViewpoints, 51);
  });

  await t.test('GET /api/v1/tours/bundle returns complete offline tour package', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tours/bundle?lang=en`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    const bundle = body.data;

    // Check bundle integrity
    assert.ok(bundle.manifest);
    assert.equal(bundle.landmarks.length, 5);
    assert.equal(bundle.floors.length, 12);

    // Verify all 51 viewpoints exist across the 12 floors
    const totalVps = bundle.floors.reduce(
      (acc: number, f: any) => acc + (f.viewpoints?.length || 0),
      0
    );
    assert.equal(totalVps, 51);

    // Verify sample viewpoint properties
    const firstVp = bundle.floors[0].viewpoints[0];
    assert.ok(firstVp.id);
    assert.ok(firstVp.title);
    assert.ok(firstVp.description);
    assert.ok(firstVp.normalizedX !== undefined);
  });

  await t.test('GET /api/v1/floors returns floor overview list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/floors`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.length, 12);
  });

  await t.test('GET /api/v1/floors/:id returns specific floor detail', async () => {
    const res = await fetch(`${baseUrl}/api/v1/floors/floor_underground`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.id, 'floor_underground');
    assert.equal(data.data.viewpoints.length, 7);
  });

  await t.test('GET /api/v1/landmarks returns 5 calibrated landmark overlays', async () => {
    const res = await fetch(`${baseUrl}/api/v1/landmarks`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.length, 5);
    const colosseum = data.data.find((l: any) => l.id === 'colosseum');
    assert.ok(colosseum);
    assert.equal(colosseum.widthMeters, 190.0);
  });

  await t.test('GET /api/v1/languages returns 8 supported languages', async () => {
    const res = await fetch(`${baseUrl}/api/v1/languages`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.length, 8);
  });

  await t.test('POST /api/v1/tickets/validate validates seeded demo token and returns sessionToken', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'COL-DEMO-2026', deviceId: 'test-device-ts' }),
    });
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.isValid, true);
    assert.equal(data.data.tier, 'full_access');
    assert.ok(data.data.sessionToken);
  });

  await t.test('POST /api/v1/tickets/validate rejects invalid token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'INVALID-TOKEN-TS' }),
    });
    assert.equal(res.status, 400);
    const data: any = await res.json();
    assert.equal(data.success, false);
  });

  await t.test('GET /api/v1/routes/pedestrian returns 8 outdoor street routes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/routes/pedestrian`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.length, 8);
    assert.ok(data.data[0].waypoints.length >= 2);
  });

  await t.test('GET /api/v1/routes/pedestrian/find finds connecting street route', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/routes/pedestrian/find?from=colosseum&to=arch_of_constantine`
    );
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.fromLandmarkCode, 'colosseum');
    assert.equal(data.data.toLandmarkCode, 'arch_of_constantine');
  });

  await t.test('GET /api/v1/park/config returns archaeological park geofence config', async () => {
    const res = await fetch(`${baseUrl}/api/v1/park/config`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.configKey, 'archaeological_park_colosseum');
    assert.equal(data.data.centerCoordinates.latitude, 41.89021);
    assert.equal(data.data.boundaryRadiusMeters, 600);
    assert.ok(data.data.proximityThresholds);
  });

  await t.test('Staff Auth & RuBAC: Curator cannot mutate viewpoint on unassigned floor', async () => {
    // 1. Sign in as curator (assigned to floor_underground & floor_1 only)
    const signinRes = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'curator@colosseumtour.it',
        password: 'ChangeMeColosseum2026!',
      }),
    });
    assert.equal(signinRes.status, 200);
    const authData: any = await signinRes.json();
    assert.equal(authData.success, true);
    const curatorToken = authData.data.token;
    assert.ok(curatorToken);

    // 2. Curator tries to create a viewpoint on floor_2 (UNASSIGNED) -> MUST be 403 Forbidden
    const forbiddenRes = await fetch(`${baseUrl}/api/v1/viewpoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${curatorToken}`,
      },
      body: JSON.stringify({
        id: 'vp_test_forbidden',
        title: 'Forbidden Viewpoint',
        floorId: 'floor_2',
        order: 99,
        normalizedPosition: { x: 0.5, y: 0.5 },
      }),
    });
    assert.equal(forbiddenRes.status, 403);
    const forbiddenData: any = await forbiddenRes.json();
    assert.equal(forbiddenData.success, false);
    assert.match(forbiddenData.message, /Curator is not assigned/);
  });

  await t.test('teardown server and disconnect DB', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
  });
});
