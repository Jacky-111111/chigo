import Link from "next/link";
import { CalendarDays, Plus, Target } from "lucide-react";
import { MealCard } from "@/components/meals/meal-card";
import { NutritionMacroRow } from "@/components/meals/nutrition-macro-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getDailyMealJournal } from "@/lib/services/meals";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { normalizeDateString } from "@/lib/utils/date-range";

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
  const journal = await getDailyMealJournal(user.id, date);

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
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Nutrition totals are estimates and may be incomplete when meals have
          not been analyzed.
        </p>
      </Card>

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
