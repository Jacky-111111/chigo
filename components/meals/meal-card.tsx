/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, MapPin, ScanText, Utensils } from "lucide-react";
import type { MealLogWithDetails } from "@/lib/services/meals";
import { NutritionMacroRow } from "@/components/meals/nutrition-macro-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MealCard({ meal }: { meal: MealLogWithDetails }) {
  return (
    <Card className="grid gap-4 p-4">
      <div className="grid gap-4 sm:grid-cols-[112px_1fr]">
        <div className="aspect-square overflow-hidden rounded-[8px] bg-[#f7f7fb]">
          {meal.signedPhotoUrl ? (
            <img
              src={meal.signedPhotoUrl}
              alt={`${meal.meal_name} meal`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-[var(--food-tangerine)]">
              <Utensils size={28} />
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                  {meal.meal_name}
                </h2>
                {meal.nutrition ? (
                  <Badge variant="warm">Estimated</Badge>
                ) : null}
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Clock size={15} />
                {formatMealTime(meal.eaten_at)}
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href={`/meals/${meal.id}`}>
                <ScanText size={16} />
                Details
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {meal.restaurant ? (
              <Badge variant="neutral">
                <MapPin size={13} />
                {meal.restaurant.name}
              </Badge>
            ) : null}
            {meal.menuItem ? (
              <Badge variant="indigo">
                {meal.menuItem.translated_name ?? meal.menuItem.original_name}
              </Badge>
            ) : null}
          </div>

          {meal.nutrition ? (
            <NutritionMacroRow
              totals={{
                calories: meal.nutrition.calories ?? 0,
                proteinG: Number(meal.nutrition.protein_g ?? 0),
                fatG: Number(meal.nutrition.fat_g ?? 0),
                carbsG: Number(meal.nutrition.carbs_g ?? 0),
              }}
              compact
            />
          ) : (
            <p className="rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
              No nutrition estimate yet.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatMealTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
