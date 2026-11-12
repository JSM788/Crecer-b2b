import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKIN_GEOFENCE_ENABLED,
  CHECKIN_GEOFENCE_RADIUS_METERS,
  evaluateCheckInGeofence,
  haversineDistanceMeters,
} from '../src/modules/field-operations/visits/services/geofence';

test('check-in geofence defaults to disabled for testing while enforcing 50m when enabled', () => {
  assert.equal(CHECKIN_GEOFENCE_ENABLED, false);
  assert.equal(CHECKIN_GEOFENCE_RADIUS_METERS, 50);

  const origin = { latitude: -12.0975, longitude: -77.0365 };
  const nearby = { latitude: -12.09775, longitude: -77.0365 }; // ~27.8 m
  const far = { latitude: -12.099, longitude: -77.0365 }; // ~166.8 m

  assert.ok(haversineDistanceMeters(origin, nearby) < 50);
  assert.ok(haversineDistanceMeters(origin, far) > 50);

  // Disabled by default: allows even far or missing coordinates while computing distance when available.
  const bypassed = evaluateCheckInGeofence(far, origin);
  assert.equal(bypassed.allowed, true);
  assert.equal(bypassed.bypassed, true);
  assert.ok((bypassed.distanceMeters ?? 0) > 100);

  // When explicitly enabled: allows within 50m and rejects outside 50m or missing coordinates.
  assert.equal(evaluateCheckInGeofence(nearby, origin, true).allowed, true);
  assert.equal(evaluateCheckInGeofence(far, origin, true).allowed, false);
  assert.equal(evaluateCheckInGeofence(null, origin, true).allowed, false);
  assert.equal(evaluateCheckInGeofence(origin, null, true).allowed, false);
});

