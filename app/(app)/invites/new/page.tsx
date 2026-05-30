import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InviteForm } from "@/components/invites/invite-form";
import { listNearbyRestaurants } from "@/lib/services/restaurants";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "New Invite",
};

export const dynamic = "force-dynamic";

type NewInvitePageProps = {
  searchParams?: Promise<{
    restaurantId?: string;
    error?: string;
  }>;
};

export default async function NewInvitePage({ searchParams }: NewInvitePageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const restaurants = await listNearbyRestaurants();
  const selectedRestaurantId = restaurants.some((restaurant) => restaurant.id === params?.restaurantId)
    ? params?.restaurantId
    : undefined;

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link href="/invites">
              <ArrowLeft size={17} />
              Back to invites
            </Link>
          </Button>
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Start a meal invite
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Pick a restaurant, choose a time in the next six hours, and open a few seats.
          </p>
        </div>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {restaurants.length > 0 ? (
        <InviteForm restaurants={restaurants} selectedRestaurantId={selectedRestaurantId} />
      ) : (
        <EmptyState
          title="No restaurants available"
          description="Run the Stage 1 restaurant seed SQL before creating invites."
          action={
            <Button asChild variant="secondary">
              <Link href="/restaurants">View restaurants</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
