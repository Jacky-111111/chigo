import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users } from "lucide-react";
import {
  getCurrentUserPlanParticipant,
  listMealPlans,
} from "@/lib/services/meal-plans";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Meal Plans",
};

export const dynamic = "force-dynamic";

type PlansPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const plans = await listMealPlans(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Meal plans
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Invite friends, compare availability, and lock in the best time.
          </p>
        </div>
        <Button asChild>
          <Link href="/plans/new">
            <Plus size={17} />
            New plan
          </Link>
        </Button>
      </div>

      {params?.error ? <Alert tone="error" message={params.error} /> : null}
      {params?.message ? (
        <Alert tone="success" message={params.message} />
      ) : null}

      {plans.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const currentParticipant = getCurrentUserPlanParticipant(
              plan,
              user.id,
            );

            return (
              <Card key={plan.id} className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black text-[var(--brand-eggplant)]">
                        {plan.title}
                      </h2>
                      <Badge
                        variant={
                          plan.status === "confirmed" ? "warm" : "indigo"
                        }
                      >
                        {formatPlanStatus(plan.status)}
                      </Badge>
                      {currentParticipant?.status === "invited" ? (
                        <Badge variant="urgent">Invited</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
                      {plan.note ?? "No note yet."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoRow
                    icon={<Users size={16} />}
                    label={`${plan.participants.length} people`}
                  />
                  <InfoRow
                    icon={<CalendarDays size={16} />}
                    label={
                      plan.bestTimeSlot
                        ? `Best: ${formatSlot(plan.bestTimeSlot.start_at)}`
                        : "No time slots"
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.candidates.slice(0, 3).map((restaurant) => (
                    <Badge key={restaurant.id} variant="neutral">
                      {restaurant.name}
                    </Badge>
                  ))}
                  {plan.candidates.length > 3 ? (
                    <Badge variant="neutral">
                      +{plan.candidates.length - 3}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <Button asChild variant="secondary">
                    <Link href={`/plans/${plan.id}`}>Open plan</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No meal plans yet"
          description="Create a plan when dinner needs more coordination than an instant invite."
          action={
            <Button asChild>
              <Link href="/plans/new">Create meal plan</Link>
            </Button>
          }
        />
      )}
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

function formatPlanStatus(status: string) {
  if (status === "collecting_availability") {
    return "Collecting";
  }

  return status;
}

function formatSlot(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
