import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { createMealPlan } from "@/lib/actions/meal-plan-actions";
import { getAcceptedFriends } from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { listNearbyRestaurants } from "@/lib/services/restaurants";
import { formatDateTimeLocalInTimeZone } from "@/lib/utils/date-range";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const metadata = {
  title: "New Meal Plan",
};

export const dynamic = "force-dynamic";

type NewPlanPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewPlanPage({ searchParams }: NewPlanPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const [restaurants, friends] = await Promise.all([
    listNearbyRestaurants(),
    getAcceptedFriends(user.id),
  ]);
  const defaultSlots = [24, 48, 72].map((hours) =>
    formatDateTimeLocalInTimeZone(
      new Date(Date.now() + hours * 60 * 60 * 1000),
    ),
  );

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/plans">
            <ArrowLeft size={17} />
            Back to plans
          </Link>
        </Button>
        <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
          Create meal plan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Pick candidate restaurants, invite friends, and collect availability
          before confirming.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {restaurants.length > 0 ? (
        <form action={createMealPlan} className="grid gap-5">
          <Card className="grid gap-5 p-5">
            <div>
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Plan details
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                A plan creates a temporary coordination chat automatically.
              </p>
            </div>

            <Field label="Title">
              <Input
                name="title"
                maxLength={120}
                placeholder="Friday dinner"
                required
              />
            </Field>

            <Field label="Note" hint="Optional">
              <Textarea
                name="note"
                maxLength={500}
                placeholder="Maybe something quick before the movie?"
              />
            </Field>

            <Field label="Duration">
              <Select name="durationMinutes" defaultValue="90">
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </Select>
            </Field>
          </Card>

          <Card className="grid gap-5 p-5">
            <div>
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Restaurant candidates
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose up to five realistic options.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {restaurants.slice(0, 16).map((restaurant) => (
                <label
                  key={restaurant.id}
                  className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3 text-sm font-semibold text-[var(--brand-eggplant)] transition hover:border-[var(--brand-indigo)] hover:bg-[#f4f3ff]"
                >
                  <input
                    type="checkbox"
                    name="restaurantIds"
                    value={restaurant.id}
                    className="size-4 accent-[var(--food-tangerine)]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{restaurant.name}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {restaurant.cuisine ?? "Restaurant"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="grid gap-5 p-5">
            <div>
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Friends
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Invite accepted friends now, or create a solo draft.
              </p>
            </div>
            {friends.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3 text-sm font-semibold text-[var(--brand-eggplant)] transition hover:border-[var(--brand-indigo)] hover:bg-[#f4f3ff]"
                  >
                    <input
                      type="checkbox"
                      name="participantIds"
                      value={friend.id}
                      className="size-4 accent-[var(--food-tangerine)]"
                    />
                    <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-eggplant)] text-xs font-black text-white">
                      {friend.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">
                        {friend.display_name}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">
                        @{friend.username}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-[8px] bg-[#f7f7fb] p-3 text-sm text-[var(--text-muted)]">
                Add friends first if you want to invite people into the plan.
              </p>
            )}
          </Card>

          <Card className="grid gap-5 p-5">
            <div>
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Time options
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Add one to five candidate time slots.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {defaultSlots.map((slot, index) => (
                <Field key={slot} label={`Option ${index + 1}`}>
                  <Input
                    name="slotStarts"
                    type="datetime-local"
                    defaultValue={slot}
                    required={index === 0}
                  />
                </Field>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              <CalendarPlus size={17} />
              Create plan
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="No restaurants available"
          description="Run the Stage 1 restaurant seed SQL before creating plans."
        />
      )}
    </section>
  );
}
