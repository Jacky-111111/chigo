import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RestaurantList } from "@/components/restaurants/restaurant-list";
import { listNearbyRestaurants } from "@/lib/services/restaurants";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Restaurants",
};

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const restaurants = await listNearbyRestaurants();

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Nearby restaurants
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Browse CMU-area spots, then start a quick invite for now or later today.
          </p>
        </div>
        <Button asChild>
          <Link href="/invites/new">
            <Plus size={17} />
            Create invite
          </Link>
        </Button>
      </div>

      {restaurants.length > 0 ? (
        <RestaurantList restaurants={restaurants} />
      ) : (
        <EmptyState
          title="No restaurants yet"
          description="Run the Stage 1 restaurant seed SQL in Supabase to populate CMU-area restaurants."
        />
      )}
    </section>
  );
}
