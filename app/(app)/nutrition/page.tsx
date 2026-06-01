import Link from "next/link";
import { CalendarDays, Plus, Settings, TrendingUp } from "lucide-react";
import { NutritionMacroRow } from "@/components/meals/nutrition-macro-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getNutritionGoals,
  getWeeklyNutritionSummary,
} from "@/lib/services/meals";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  formatShortDate,
  getWeekStartDateString,
  normalizeDateString,
} from "@/lib/utils/date-range";

export const metadata = {
  title: "Nutrition",
};

export const dynamic = "force-dynamic";

type NutritionPageProps = {
  searchParams?: Promise<{
    weekStart?: string;
  }>;
};

export default async function NutritionPage({
  searchParams,
}: NutritionPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const weekStart = getWeekStartDateString(
    normalizeDateString(params?.weekStart),
  );
  const [summary, goals] = await Promise.all([
    getWeeklyNutritionSummary(user.id, weekStart),
    getNutritionGoals(user.id),
  ]);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Nutrition dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Review estimated calories and macros by week. ChiGo does not provide
            medical advice.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/settings/nutrition">
              <Settings size={17} />
              Goals
            </Link>
          </Button>
          <Button asChild>
            <Link href="/meals/new">
              <Plus size={17} />
              Add meal
            </Link>
          </Button>
        </div>
      </div>

      <Card className="grid gap-4 p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          action="/nutrition"
        >
          <label className="grid gap-2 text-sm font-semibold text-[var(--brand-eggplant)]">
            <span className="flex items-center gap-2">
              <CalendarDays size={16} />
              Week of
            </span>
            <Input
              name="weekStart"
              type="date"
              defaultValue={summary.weekStartDate}
            />
          </label>
          <Button type="submit" variant="secondary">
            View week
          </Button>
        </form>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Meals logged" value={summary.mealsLogged} />
          <Metric
            label="Avg daily calories"
            value={summary.averageDailyCalories}
          />
          <Metric
            label="Protein goal"
            value={
              goals?.daily_protein_target_g
                ? `${goals.daily_protein_target_g}g`
                : "Not set"
            }
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <Card className="grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[var(--food-tangerine)]" size={20} />
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Daily trend
              </h2>
            </div>

            <div className="grid gap-3">
              {summary.days.map((day) => (
                <div
                  key={day.date}
                  className="grid gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-black text-[var(--brand-eggplant)]">
                        {formatShortDate(day.date)}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">
                        {day.mealCount} meals
                      </p>
                    </div>
                    <Button asChild variant="ghost" className="min-h-9 px-3">
                      <Link href={`/meals?date=${day.date}`}>Open day</Link>
                    </Button>
                  </div>
                  <NutritionMacroRow totals={day.totals} compact />
                </div>
              ))}
            </div>
          </Card>
        </section>

        <aside className="grid h-fit gap-4">
          <Card className="grid gap-3 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Insight
            </h2>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {summary.insight}
            </p>
          </Card>

          <Card className="grid gap-3 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Frequent restaurants
            </h2>
            {summary.topRestaurants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.topRestaurants.map((restaurant) => (
                  <Badge key={restaurant.name} variant="warm">
                    {restaurant.name}: {restaurant.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Link meals to restaurants to see patterns.
              </p>
            )}
          </Card>

          <Card className="grid gap-3 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Current goals
            </h2>
            <div className="grid gap-2 text-sm font-semibold text-[var(--text-muted)]">
              <p>Calories: {goals?.daily_calorie_target ?? "Not set"}</p>
              <p>
                Protein:{" "}
                {goals?.daily_protein_target_g
                  ? `${goals.daily_protein_target_g}g`
                  : "Not set"}
              </p>
              <p>Goal: {goals?.goal_type?.replace("_", " ") ?? "Not set"}</p>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] bg-[#f7f7fb] p-4">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--brand-eggplant)]">
        {value}
      </p>
    </div>
  );
}
