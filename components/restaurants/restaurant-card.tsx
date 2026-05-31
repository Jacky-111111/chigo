import Image from "next/image";
import Link from "next/link";
import { BookOpenText, MapPin, Navigation, Plus, Utensils } from "lucide-react";
import type { Restaurant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RestaurantCard({
  restaurant,
  distance,
}: {
  restaurant: Restaurant;
  distance: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] w-full food-photo-fallback">
        {restaurant.photo_url ? (
          <Image
            src={restaurant.photo_url}
            alt={`${restaurant.name} food`}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-white">
            <Utensils size={32} />
          </div>
        )}
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black leading-tight text-[var(--brand-eggplant)]">
                {restaurant.name}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <MapPin size={14} />
                {distance}
              </p>
            </div>
            {restaurant.price_level ? (
              <Badge variant="warm">{"$".repeat(restaurant.price_level)}</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {restaurant.cuisine ? (
              <Badge variant="warm">{restaurant.cuisine}</Badge>
            ) : null}
            <Badge variant="neutral">{restaurant.address}</Badge>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href={`/restaurants/${restaurant.id}`}>
              <BookOpenText size={16} />
              Details
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/invites/new?restaurantId=${restaurant.id}`}>
              <Plus size={16} />
              Invite
            </Link>
          </Button>
          {restaurant.google_maps_url ? (
            <Button asChild variant="secondary" className="sm:col-span-2">
              <a
                href={restaurant.google_maps_url}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={16} />
                Directions
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
