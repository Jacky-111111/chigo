import type { Restaurant } from "@/types/database";

export const CMU_LOCATION = {
  label: "Carnegie Mellon University",
  latitude: 40.4433,
  longitude: -79.9436,
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function distanceInMiles(from: Coordinates, to: Coordinates) {
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

export function sortRestaurantsByDistance(restaurants: Restaurant[], origin: Coordinates) {
  return [...restaurants].sort((a, b) => {
    const distanceA = distanceInMiles(origin, {
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
    });
    const distanceB = distanceInMiles(origin, {
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
    });

    return distanceA - distanceB;
  });
}

export function formatDistance(miles: number) {
  if (miles < 0.1) {
    return "<0.1 mi";
  }

  return `${miles.toFixed(1)} mi`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
