import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Clock, Users, X } from "lucide-react";
import {
  confirmMealPlan,
  respondToMealPlanInvitation,
  submitMealPlanAvailability,
} from "@/lib/actions/meal-plan-actions";
import { ChatPanel } from "@/components/chats/chat-panel";
import { getMealPlanChatThreadDetail } from "@/lib/services/chats";
import {
  buildGoogleCalendarUrl,
  getCurrentUserPlanParticipant,
  getMealPlanDetail,
} from "@/lib/services/meal-plans";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

type PlanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function PlanDetailPage({
  params,
  searchParams,
}: PlanDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const [plan, chatThread] = await Promise.all([
    getMealPlanDetail(id),
    getMealPlanChatThreadDetail(id),
  ]);

  if (!plan) {
    notFound();
  }

  const currentParticipant = getCurrentUserPlanParticipant(plan, user.id);
  const isCreator = plan.creator_id === user.id;
  const googleCalendarUrl = buildGoogleCalendarUrl(plan);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/plans">
            <ArrowLeft size={17} />
            Back to plans
          </Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant={plan.status === "confirmed" ? "warm" : "indigo"}>
                {formatPlanStatus(plan.status)}
              </Badge>
              {currentParticipant?.status === "invited" ? (
                <Badge variant="urgent">Invitation pending</Badge>
              ) : null}
              {isCreator ? <Badge variant="indigo">Creator</Badge> : null}
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              {plan.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {plan.note ??
                "Collect availability and confirm the best meal time."}
            </p>
          </div>
        </div>
      </div>

      {query?.error ? <Alert tone="error" message={query.error} /> : null}
      {query?.message ? <Alert tone="success" message={query.message} /> : null}

      {currentParticipant?.status === "invited" ? (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              You were invited
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Join to stay in the plan, or decline to leave this coordination
              chat.
            </p>
          </div>
          <div className="flex gap-2">
            <form action={respondToMealPlanInvitation}>
              <input type="hidden" name="planId" value={plan.id} />
              <input type="hidden" name="response" value="joined" />
              <Button type="submit">
                <Check size={16} />
                Join
              </Button>
            </form>
            <form action={respondToMealPlanInvitation}>
              <input type="hidden" name="planId" value={plan.id} />
              <input type="hidden" name="response" value="declined" />
              <Button type="submit" variant="secondary">
                <X size={16} />
                Decline
              </Button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <Card className="grid gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                icon={<Users size={18} />}
                label="Participants"
                value={String(plan.participants.length)}
              />
              <Metric
                icon={<Clock size={18} />}
                label="Best time"
                value={
                  plan.bestTimeSlot
                    ? formatSlotRange(
                        plan.bestTimeSlot.start_at,
                        plan.bestTimeSlot.end_at,
                      )
                    : "Pending"
                }
              />
              <Metric
                icon={<CalendarDays size={18} />}
                label="Options"
                value={String(plan.timeSlots.length)}
              />
            </div>

            {plan.status === "confirmed" && plan.confirmed_start_at ? (
              <div className="flex flex-col gap-3 rounded-[8px] border border-[rgba(236,178,45,0.35)] bg-[rgba(236,178,45,0.14)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--brand-eggplant)]">
                    Confirmed for {formatSlot(plan.confirmed_start_at)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Share the calendar link with everyone in the plan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {googleCalendarUrl ? (
                    <Button asChild variant="secondary">
                      <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Google Calendar
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="secondary">
                    <Link href={`/plans/${plan.id}/calendar`}>
                      Download .ics
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Availability
            </h2>
            <div className="grid gap-3">
              {plan.timeSlots.map((slot) => {
                const myAvailability =
                  slot.availability.find((item) => item.user_id === user.id)
                    ?.availability ?? null;

                return (
                  <div
                    key={slot.id}
                    className="grid gap-3 rounded-[8px] border border-[var(--border)] bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-[var(--brand-eggplant)]">
                          {formatSlotRange(slot.start_at, slot.end_at)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          Score {slot.score} · {slot.yesCount} yes ·{" "}
                          {slot.maybeCount} maybe · {slot.noCount} no
                        </p>
                      </div>
                      {plan.bestTimeSlot?.id === slot.id ? (
                        <Badge variant="warm">Best overlap</Badge>
                      ) : null}
                    </div>

                    {currentParticipant?.status !== "declined" ? (
                      <div className="flex flex-wrap gap-2">
                        {(["yes", "maybe", "no"] as const).map((value) => (
                          <form key={value} action={submitMealPlanAvailability}>
                            <input
                              type="hidden"
                              name="planId"
                              value={plan.id}
                            />
                            <input
                              type="hidden"
                              name="timeSlotId"
                              value={slot.id}
                            />
                            <input
                              type="hidden"
                              name="availability"
                              value={value}
                            />
                            <Button
                              type="submit"
                              variant={
                                myAvailability === value
                                  ? "primary"
                                  : "secondary"
                              }
                              className="min-h-9 px-3"
                            >
                              {formatAvailability(value)}
                            </Button>
                          </form>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          {chatThread ? (
            <ChatPanel
              threadId={chatThread.id}
              currentUserId={user.id}
              initialMessages={chatThread.messages}
              title="Plan chat"
              emptyHint="Ask who prefers which restaurant, or clarify timing before confirming."
            />
          ) : null}
        </div>

        <div className="grid h-fit gap-4">
          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Restaurants
            </h2>
            <div className="grid gap-2">
              {plan.candidates.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="rounded-[8px] border border-[var(--border)] bg-white p-3"
                >
                  <p className="font-black text-[var(--brand-eggplant)]">
                    {restaurant.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                    {restaurant.cuisine ?? "Restaurant"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              People
            </h2>
            <div className="grid gap-3">
              {plan.participants.map((participant) => (
                <Link
                  key={participant.user_id}
                  href={`/users/${participant.profile.username}`}
                  className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-eggplant)] text-xs font-black text-white">
                      {participant.profile.display_name
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--brand-eggplant)]">
                        {participant.profile.display_name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-[var(--text-muted)]">
                        @{participant.profile.username}
                      </span>
                    </span>
                  </span>
                  <Badge
                    variant={
                      participant.status === "joined" ? "indigo" : "neutral"
                    }
                  >
                    {participant.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>

          {isCreator && plan.status !== "confirmed" ? (
            <Card className="grid gap-4 p-5">
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Confirm plan
              </h2>
              <form action={confirmMealPlan} className="grid gap-3">
                <input type="hidden" name="planId" value={plan.id} />
                <Select
                  name="restaurantId"
                  defaultValue={plan.candidates[0]?.id}
                  required
                >
                  {plan.candidates.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </Select>
                <Select
                  name="timeSlotId"
                  defaultValue={plan.bestTimeSlot?.id ?? plan.timeSlots[0]?.id}
                  required
                >
                  {plan.timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {formatSlotRange(slot.start_at, slot.end_at)}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Confirm meal</Button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] bg-[#f7f7fb] p-4">
      <div className="mb-2 text-[var(--food-tangerine)]">{icon}</div>
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[var(--brand-eggplant)]">
        {value}
      </p>
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
    return "Collecting availability";
  }

  return status;
}

function formatSlot(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSlotRange(startAt: string, endAt: string) {
  return `${formatSlot(startAt)}-${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(endAt))}`;
}

function formatAvailability(value: "yes" | "maybe" | "no") {
  if (value === "yes") {
    return "Yes";
  }

  if (value === "maybe") {
    return "Maybe";
  }

  return "No";
}
