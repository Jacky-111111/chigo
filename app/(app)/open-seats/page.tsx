import type { ReactNode } from "react";
import { Armchair, Clock, MapPin, Users } from "lucide-react";
import {
  closeOpenSeatPost,
  createOpenSeatPost,
} from "@/lib/actions/open-seat-actions";
import { listActiveOpenSeatPosts } from "@/lib/services/open-seats";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { listNearbyRestaurants } from "@/lib/services/restaurants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const metadata = {
  title: "Open Seats",
};

export const dynamic = "force-dynamic";

type OpenSeatsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function OpenSeatsPage({
  searchParams,
}: OpenSeatsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const [posts, restaurants] = await Promise.all([
    listActiveOpenSeatPosts(),
    listNearbyRestaurants(),
  ]);

  return (
    <section className="page-shell grid gap-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
          Open seats
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          Already eating? Post open seats so nearby classmates can join before
          the moment passes.
        </p>
      </div>

      {params?.error ? <Alert tone="error" message={params.error} /> : null}
      {params?.message ? (
        <Alert tone="success" message={params.message} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit p-5">
          <form action={createOpenSeatPost} className="grid gap-4">
            <div>
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Post seats
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Defaults to 45 minutes.
              </p>
            </div>

            <Field label="Restaurant">
              <Select name="restaurantId" defaultValue="">
                <option value="">No restaurant selected</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Current location">
              <Input
                name="locationLabel"
                maxLength={120}
                placeholder="Cohon Center, 2nd floor"
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Field label="Open seats">
                <Select name="availableSeats" defaultValue="2">
                  {Array.from({ length: 8 }, (_, index) => index + 1).map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ),
                  )}
                </Select>
              </Field>

              <Field label="Expires in">
                <Select name="durationMinutes" defaultValue="45">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                </Select>
              </Field>
            </div>

            <label className="flex items-center gap-3 rounded-[8px] bg-[#f7f7fb] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
              <input
                type="checkbox"
                name="strangersWelcome"
                defaultChecked
                className="size-4 accent-[var(--food-tangerine)]"
              />
              Strangers welcome
            </label>

            <Button type="submit">
              <Armchair size={17} />
              Post open seats
            </Button>
          </form>
        </Card>

        {posts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <Card key={post.id} className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                      {post.location_label}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
                      Hosted by {post.host.display_name}
                    </p>
                  </div>
                  <Badge variant={post.strangers_welcome ? "warm" : "indigo"}>
                    {post.strangers_welcome ? "Open" : "Friends"}
                  </Badge>
                </div>

                <div className="grid gap-2">
                  <InfoRow
                    icon={<Users size={16} />}
                    label={`${post.available_seats} seats`}
                  />
                  <InfoRow
                    icon={<Clock size={16} />}
                    label={`Until ${formatTime(post.expires_at)}`}
                  />
                  <InfoRow
                    icon={<MapPin size={16} />}
                    label={post.restaurant?.name ?? "Current spot"}
                  />
                </div>

                {post.host_id === user.id ? (
                  <form action={closeOpenSeatPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                    >
                      Close post
                    </Button>
                  </form>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open seats right now"
            description="When someone already eating has room, their post will appear here."
          />
        )}
      </div>
    </section>
  );
}

function InfoRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--brand-eggplant)]">
      <span className="text-[var(--food-tangerine)]">{icon}</span>
      {label}
    </div>
  );
}

function Alert({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]"
          : "rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]"
      }
    >
      {message}
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
