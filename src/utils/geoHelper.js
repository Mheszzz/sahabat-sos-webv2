/**
 * geoHelper.js
 * Utilitas kalkulasi geospasial & jarak antar koordinat (Formula Haversine).
 */

export const EARTH_RADIUS_KM = Number(import.meta.env.VITE_EARTH_RADIUS_KM || 6371);

/**
 * Menghitung jarak antara dua koordinat GPS dalam kilometer menggunakan Formula Haversine
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2, radiusKm = EARTH_RADIUS_KM) {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

/**
 * Format teks jarak ramah pengguna (misal: "450 m" atau "2.4 km")
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}
