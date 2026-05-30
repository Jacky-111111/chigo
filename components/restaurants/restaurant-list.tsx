"use client";

import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types/database";
import { CMU_LOCATION, distanceInMiles, formatDistance, sortRestaurantsByDistance } from "@/lib/utils/location";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";

type ClientLocation = {
  latitude: number;
  longitude: number;
  source: "browser" | "cmu";
};

export function RestaurantList({ restaurants }: { restaurants: Restaurant[] }) {
  const [location, setLocation] = useState<ClientLocation>({
    latitude: CMU_LOCATION.latitude,
    longitude: CMU_LOCATION.longitude,
    source: "cmu",
  });
  const [locationMessage, setLocationMessage] = useState("Using CMU as your default location.");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Browser location is unavailable. Using CMU as your default.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "browser",
        });
        setLocationMessage("Sorted from your current location.");
      },
      () => {
        setLocationMessage("Location permission denied. Using CMU as your default.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 5000,
      },
    );
  }, []);

  const sortedRestaurants = useMemo(
    () => sortRestaurantsByDistance(restaurants, location),
    [location, restaurants],
  );

  return (
    <div className="grid gap-4">
      <p className="rounded-[8px] border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">
        {locationMessage} {location.source === "browser" ? "Nice, food radar is live." : null}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            distance={formatDistance(
              distanceInMiles(location, {
                latitude: Number(restaurant.latitude),
                longitude: Number(restaurant.longitude),
              }),
            )}
          />
        ))}
      </div>
    </div>
  );
}
