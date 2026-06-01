import Link from "next/link";
import { Activity, CalendarDays, PieChart, Plus, Target } from "lucide-react";
import { MealCheckInCalendar } from "@/components/meals/meal-check-in-calendar";
import { MealCard } from "@/components/meals/meal-card";
import { MacroDistributionChart } from "@/components/meals/macro-distribution-chart";
import { NutritionGoalProgress } from "@/components/meals/nutrition-goal-progress";
import { NutritionLineChart } from "@/components/meals/nutrition-line-chart";
import { NutritionMacroRow } from "@/components/meals/nutrition-macro-row";
import { TimingDistribution } from "@/components/meals/timing-distribution";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  getDailyMealJournal,
  getMealCheckInCalendar,
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
  title: "Meals",
};

export const dynamic = "force-dynamic";

type MealsPageProps = {
  searchParams?: Promise<{
    date?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const date = normalizeDateString(params?.date);
  const weekStart = getWeekStartDateString(date);
  const [journal, weekSummary, goals, checkInCalendar] = await Promise.all([
    getDailyMealJournal(user.id, date),
    getWeeklyNutritionSummary(user.id, weekStart),
    getNutritionGoals(user.id),
    getMealCheckInCalendar(user.id, date),
  ]);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Meal journal
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Track meals, photos, and approximate nutrition without turning food
            into homework.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/nutrition">
              <Target size={17} />
              Nutrition
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

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {params?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {params.message}
        </div>
      ) : null}

      <Card className="grid gap-4 p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          action="/meals"
        >
          <label className="grid gap-2 text-sm font-semibold text-[var(--brand-eggplant)]">
            <span className="flex items-center gap-2">
              <CalendarDays size={16} />
              Day
            </span>
            <Input name="date" type="date" defaultValue={date} />
          </label>
          <Button type="submit" variant="secondary">
            View day
          </Button>
        </form>

        <NutritionMacroRow totals={journal.totals} />
        <NutritionGoalProgress
          goals={goals}
          totals={journal.totals}
          label="Selected day vs goals"
        />
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Nutrition totals are estimates and may be incomplete when meals have
          not been analyzed.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <JournalMetric label="Meals" value={journal.meals.length} />
        <JournalMetric
          label="Estimate coverage"
          value={`${journal.estimateCoveragePercent}%`}
        />
        <JournalMetric
          label="Missing estimates"
          value={journal.mealsWithoutEstimates}
        />
        <JournalMetric
          label="Largest meal"
          value={
            journal.largestMeal
              ? `${journal.largestMeal.calories} cal`
              : "Not yet"
          }
        />
      </div>

      <MealCheckInCalendar calendar={checkInCalendar} />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="text-[var(--food-tangerine)]" size={20} />
                <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                  Week calories
                </h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                {formatShortDate(weekSummary.weekStartDate)} -{" "}
                {formatShortDate(weekSummary.weekEndDate)}
              </p>
            </div>
            <Badge variant="indigo">{weekSummary.mealsLogged} meals</Badge>
          </div>
          <NutritionLineChart
            calorieTarget={goals?.daily_calorie_target}
            days={weekSummary.days}
            selectedDate={date}
          />
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <PieChart className="text-[var(--food-saffron)]" size={20} />
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Macro calories
              </h2>
            </div>
            <MacroDistributionChart totals={journal.totals} />
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Meal timing
            </h2>
            <TimingDistribution buckets={journal.timingBuckets} />
          </Card>
        </div>
      </div>

      {journal.meals.length > 0 ? (
        <div className="grid gap-4">
          {journal.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No meals logged for this day"
          description="Add a meal manually or with a photo to start building your daily journal."
          action={
            <Button asChild>
              <Link href="/meals/new">
                <Plus size={17} />
                Add meal
              </Link>
            </Button>
          }
        />
      )}
    </section>
  );
}

function JournalMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--brand-eggplant)]">
        {value}
      </p>
    </Card>
  );
}
