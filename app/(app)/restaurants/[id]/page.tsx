import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ImageUp,
  MapPin,
  Navigation,
  Plus,
  Utensils,
} from "lucide-react";
import { InviteCard } from "@/components/invites/invite-card";
import { MenuUploadSummaryCard } from "@/components/menus/menu-upload-summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getRestaurantDetail } from "@/lib/services/restaurants";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Restaurant",
};

export const dynamic = "force-dynamic";

type RestaurantDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const detail = await getRestaurantDetail(id, user.id);

  if (!detail) {
    notFound();
  }

  const { restaurant, activeInvites, menuAnalyses } = detail;

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/restaurants">
            <ArrowLeft size={17} />
            Back to restaurants
          </Link>
        </Button>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {restaurant.cuisine ? (
                <Badge variant="warm">{restaurant.cuisine}</Badge>
              ) : null}
              {restaurant.price_level ? (
                <Badge variant="neutral">
                  {"$".repeat(restaurant.price_level)}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-5xl">
                {restaurant.name}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[var(--text-muted)]">
                <MapPin className="mt-0.5 shrink-0" size={16} />
                {restaurant.address}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href={`/invites/new?restaurantId=${restaurant.id}`}>
                  <Plus size={17} />
                  Create invite
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/menus/new?restaurantId=${restaurant.id}`}>
                  <ImageUp size={17} />
                  Upload menu
                </Link>
              </Button>
              {restaurant.google_maps_url ? (
                <Button asChild variant="secondary">
                  <a
                    href={restaurant.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={17} />
                    Directions
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="relative aspect-[16/11] food-photo-fallback">
              {restaurant.photo_url ? (
                <Image
                  src={restaurant.photo_url}
                  alt={`${restaurant.name} food`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-white">
                  <Utensils size={34} />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[var(--brand-eggplant)]">
              Active invites
            </h2>
            <Button
              asChild
              variant="secondary"
              className="hidden sm:inline-flex"
            >
              <Link href={`/invites/new?restaurantId=${restaurant.id}`}>
                <Plus size={16} />
                Invite
              </Link>
            </Button>
          </div>

          {activeInvites.length > 0 ? (
            <div className="grid gap-4">
              {activeInvites.map((invite) => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  currentUserId={user.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active invites here"
              description="Start a quick invite for this restaurant when you are ready to eat."
              action={
                <Button asChild>
                  <Link href={`/invites/new?restaurantId=${restaurant.id}`}>
                    <Plus size={17} />
                    Create invite
                  </Link>
                </Button>
              }
            />
          )}
        </section>

        <section className="grid h-fit gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[var(--brand-eggplant)]">
              Menus
            </h2>
            <Button asChild variant="secondary">
              <Link href={`/menus/new?restaurantId=${restaurant.id}`}>
                <ImageUp size={16} />
                Upload
              </Link>
            </Button>
          </div>

          {menuAnalyses.length > 0 ? (
            <div className="grid gap-4">
              {menuAnalyses.map((upload) => (
                <MenuUploadSummaryCard key={upload.id} upload={upload} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No menu analyses"
              description="Upload a menu photo to make this restaurant easier to order from."
            />
          )}
        </section>
      </div>
    </section>
  );
}
