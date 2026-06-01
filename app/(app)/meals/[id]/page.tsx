/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Clock, Trash2, Utensils } from "lucide-react";
import {
  deleteMealLog,
  estimateMealNutrition,
} from "@/lib/actions/meal-actions";
import { MealForm } from "@/components/meals/meal-form";
import { NutritionMacroRow } from "@/components/meals/nutrition-macro-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getMealDetail, listMealFormOptions } from "@/lib/services/meals";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Meal",
};

export const dynamic = "force-dynamic";

type MealDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MealDetailPage({
  params,
  searchParams,
}: MealDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const [meal, formOptions] = await Promise.all([
    getMealDetail(id, user.id),
    listMealFormOptions(user.id),
  ]);

  if (!meal) {
    notFound();
  }

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/meals">
            <ArrowLeft size={17} />
            Back to meals
          </Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {meal.nutrition ? (
                <Badge variant="warm">Nutrition estimated</Badge>
              ) : null}
              {meal.restaurant ? (
                <Badge variant="neutral">{meal.restaurant.name}</Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              {meal.meal_name}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Clock size={16} />
              {formatMealDate(meal.eaten_at)}
            </p>
          </div>

          <form action={deleteMealLog}>
            <input type="hidden" name="mealId" value={meal.id} />
            <SubmitButton pendingLabel="Deleting..." variant="danger">
              <Trash2 size={16} />
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      {query?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {query.error}
        </div>
      ) : null}

      {query?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {query.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="aspect-[4/3] bg-[#f7f7fb]">
            {meal.signedPhotoUrl ? (
              <img
                src={meal.signedPhotoUrl}
                alt={`${meal.meal_name} meal`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-[var(--food-tangerine)]">
                <Utensils size={34} />
              </div>
            )}
          </div>
          <div className="grid gap-3 p-4">
            {meal.notes ? (
              <p className="rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm leading-6 text-[var(--text-main)]">
                {meal.notes}
              </p>
            ) : null}
            {meal.menuItem ? (
              <Badge variant="indigo">
                {meal.menuItem.translated_name ?? meal.menuItem.original_name}
              </Badge>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                  Nutrition estimate
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Approximate calories and macros. Not medical advice.
                </p>
              </div>
              <form action={estimateMealNutrition}>
                <input type="hidden" name="mealId" value={meal.id} />
                <SubmitButton pendingLabel="Estimating..." variant="secondary">
                  <Camera size={16} />
                  {meal.nutrition ? "Refresh" : "Estimate"}
                </SubmitButton>
              </form>
            </div>

            {meal.nutrition ? (
              <>
                <NutritionMacroRow
                  totals={{
                    calories: meal.nutrition.calories ?? 0,
                    proteinG: Number(meal.nutrition.protein_g ?? 0),
                    fatG: Number(meal.nutrition.fat_g ?? 0),
                    carbsG: Number(meal.nutrition.carbs_g ?? 0),
                  }}
                />
                {meal.nutrition.confidence !== null ? (
                  <p className="text-xs font-semibold text-[var(--text-muted)]">
                    Confidence: {Math.round(meal.nutrition.confidence * 100)}%
                    {meal.nutrition.ai_model
                      ? ` via ${meal.nutrition.ai_model}`
                      : ""}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                No estimate yet. Add details or a photo, then run estimation.
              </p>
            )}
          </Card>

          <MealForm
            meal={meal}
            restaurants={formOptions.restaurants}
            menuItems={formOptions.menuItems}
          />
        </div>
      </div>
    </section>
  );
}

function formatMealDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
