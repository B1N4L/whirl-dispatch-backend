/**
 * Haversine Formula Utility
 * Calculates great-circle distances between GPS coordinates on a spherical Earth.
 */

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100; // Rounded to two decimal places
}

export function isInsideGeofence(
  deviceLat: number,
  deviceLon: number,
  facilityLat: number,
  facilityLon: number,
  geofenceRadiusMeters: number,
  accuracyMeters: number = 0
): { isInside: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(deviceLat, deviceLon, facilityLat, facilityLon);
  // Allow GPS horizontal accuracy buffer (up to 15m) if within marginal threshold
  const effectiveRadius = geofenceRadiusMeters + Math.min(accuracyMeters, 15);
  const isInside = distanceMeters <= effectiveRadius;

  return { isInside, distanceMeters };
}
